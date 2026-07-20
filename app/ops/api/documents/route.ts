import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/ops/audit";
import { DATA_ROOM_CATEGORIES } from "@/lib/ops/types";

// Allowed data-room file formats (extension-based allowlist).
const ALLOWED_EXTENSIONS = ["pdf", "docx", "xlsx", "pptx", "csv", "png", "jpg", "jpeg"];
// Safety cap — not spec-mandated, but a sane guard against abuse of the
// private bucket. Adjust if founders need to upload larger files.
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const CURRENT_VERSION_SELECT =
  "*, current_version:ops_document_versions!ops_documents_current_version_fk(id, storage_path, version_label, size, mime, uploaded_by, uploaded_at)";

function isValidCategory(category: string): boolean {
  return DATA_ROOM_CATEGORIES.some((c) => c.id === category);
}

function extensionOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i + 1).toLowerCase();
}

function safeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.slice(-180) || "file";
}

// GET /ops/api/documents[?q=][&category=][&include_deleted=1]
// Lists data-room documents (metadata only) with their current version info.
export async function GET(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const category = req.nextUrl.searchParams.get("category")?.trim();
  const includeDeleted = req.nextUrl.searchParams.get("include_deleted") === "1";

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("ops_documents")
    .select(CURRENT_VERSION_SELECT)
    .order("updated_at", { ascending: false });

  if (!includeDeleted) query = query.is("deleted_at", null);
  if (category) query = query.eq("category", category);
  if (q) {
    const esc = q.replace(/[%,]/g, "");
    query = query.or(`name.ilike.%${esc}%,description.ilike.%${esc}%,category.ilike.%${esc}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data ?? [] });
}

// POST /ops/api/documents  (multipart/form-data: file, category, name?, description?, confidential?)
// Creates a new document, or — if a non-deleted document with the same
// name+category already exists — appends a new version to it. Never
// overwrites a prior version's storage object.
export async function POST(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "invalid form data" }, { status: 400 });

  const file = form.get("file");
  const category = String(form.get("category") ?? "").trim();
  const nameRaw = form.get("name");
  const descriptionRaw = form.get("description");
  const confidentialRaw = form.get("confidential");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!category || !isValidCategory(category)) {
    return NextResponse.json({ error: "valid category is required" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "file is empty" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "file exceeds the 50MB limit" }, { status: 400 });
  }

  const ext = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `unsupported file type .${ext || "?"}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const name = (typeof nameRaw === "string" && nameRaw.trim()) || file.name;
  const description = typeof descriptionRaw === "string" && descriptionRaw.trim() ? descriptionRaw.trim() : null;
  const confidential = confidentialRaw === "true" || confidentialRaw === "1" || confidentialRaw === "on";

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  // Versioning rule: same name + category (and not soft-deleted) → new version.
  const { data: existing, error: findErr } = await supabase
    .from("ops_documents")
    .select("id, category, name")
    .eq("category", category)
    .eq("name", name)
    .is("deleted_at", null)
    .maybeSingle();
  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });

  const isNewDocument = !existing;
  const documentId = existing?.id ?? randomUUID();
  const versionId = randomUUID();
  const storagePath = `${category}/${documentId}/${versionId}__${safeFilename(file.name)}`;

  const { count: versionCount, error: countErr } = await supabase
    .from("ops_document_versions")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId);
  if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 });
  const versionLabel = `v${(versionCount ?? 0) + 1}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await admin.storage
    .from("data-room")
    .upload(storagePath, buffer, { contentType: file.type || undefined, upsert: false });
  if (uploadErr) {
    return NextResponse.json({ error: `storage upload failed: ${uploadErr.message}` }, { status: 500 });
  }

  try {
    if (isNewDocument) {
      const { error: docErr } = await supabase.from("ops_documents").insert({
        id: documentId,
        category,
        name,
        description,
        confidential,
        created_by: guard.email,
      });
      if (docErr) throw docErr;
    }

    const { error: versionErr } = await supabase.from("ops_document_versions").insert({
      id: versionId,
      document_id: documentId,
      storage_path: storagePath,
      version_label: versionLabel,
      size: file.size,
      mime: file.type || null,
      uploaded_by: guard.email,
    });
    if (versionErr) throw versionErr;

    const { data: updatedDoc, error: updErr } = await supabase
      .from("ops_documents")
      .update({ current_version_id: versionId })
      .eq("id", documentId)
      .select(CURRENT_VERSION_SELECT)
      .single();
    if (updErr) throw updErr;

    await logAudit({
      actor_email: guard.email,
      action: "upload",
      target_type: "document",
      target_id: documentId,
      detail: { version_id: versionId, version_label: versionLabel, name, category, size: file.size, is_new_document: isNewDocument },
    });

    return NextResponse.json({ document: updatedDoc });
  } catch (e) {
    // Best-effort cleanup so we don't leak an orphaned object in the bucket.
    await admin.storage.from("data-room").remove([storagePath]).catch(() => {});
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
