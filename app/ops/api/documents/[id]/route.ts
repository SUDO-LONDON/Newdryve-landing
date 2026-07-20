import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/ops/audit";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED_EXTENSIONS = ["pdf", "docx", "xlsx", "pptx", "csv", "png", "jpg", "jpeg"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const CURRENT_VERSION_SELECT =
  "*, current_version:ops_document_versions!ops_documents_current_version_fk(id, storage_path, version_label, size, mime, uploaded_by, uploaded_at)";

function extensionOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i + 1).toLowerCase();
}

function safeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.slice(-180) || "file";
}

// GET /ops/api/documents/[id] — document metadata + full version history
// (newest first), used by the version-history expander in the UI.
export async function GET(_req: NextRequest, { params }: Ctx) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const [{ data: document, error: docErr }, { data: versions, error: verErr }] = await Promise.all([
    supabase.from("ops_documents").select(CURRENT_VERSION_SELECT).eq("id", id).maybeSingle(),
    supabase
      .from("ops_document_versions")
      .select("*")
      .eq("document_id", id)
      .order("uploaded_at", { ascending: false }),
  ]);
  if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 });
  if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 });
  if (!document) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ document, versions: versions ?? [] });
}

// PATCH /ops/api/documents/[id]
//  - multipart/form-data with `file` → replace: uploads a new version,
//    keeping every prior version's storage object intact. Audited "replace".
//  - JSON { restore: true } → un-deletes a soft-deleted document. Audited
//    "restore".
//  - JSON { name?, description?, confidential? } → metadata edit. Audited
//    "rename" if the name changed, otherwise "update".
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const contentType = req.headers.get("content-type") || "";

  // ---- Replace: upload a new version ---------------------------------
  if (contentType.includes("multipart/form-data")) {
    const { data: doc, error: findErr } = await supabase
      .from("ops_documents")
      .select("id, category, name, deleted_at")
      .eq("id", id)
      .maybeSingle();
    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
    if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (doc.deleted_at) return NextResponse.json({ error: "document is deleted" }, { status: 400 });

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });
    if (file.size === 0) return NextResponse.json({ error: "file is empty" }, { status: 400 });
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

    const admin = createSupabaseAdminClient();
    const versionId = randomUUID();
    const storagePath = `${doc.category}/${doc.id}/${versionId}__${safeFilename(file.name)}`;

    const { count: versionCount, error: countErr } = await supabase
      .from("ops_document_versions")
      .select("id", { count: "exact", head: true })
      .eq("document_id", id);
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
      const { error: versionErr } = await supabase.from("ops_document_versions").insert({
        id: versionId,
        document_id: id,
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
        .eq("id", id)
        .select(CURRENT_VERSION_SELECT)
        .single();
      if (updErr) throw updErr;

      await logAudit({
        actor_email: guard.email,
        action: "replace",
        target_type: "document",
        target_id: id,
        detail: { version_id: versionId, version_label: versionLabel, size: file.size },
      });

      return NextResponse.json({ document: updatedDoc });
    } catch (e) {
      await admin.storage.from("data-room").remove([storagePath]).catch(() => {});
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }

  // ---- JSON: restore, or metadata edit ---------------------------------
  const body = await req.json().catch(() => null);

  if (body?.restore === true) {
    const { data: document, error } = await supabase
      .from("ops_documents")
      .update({ deleted_at: null })
      .eq("id", id)
      .select(CURRENT_VERSION_SELECT)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAudit({
      actor_email: guard.email,
      action: "restore",
      target_type: "document",
      target_id: id,
    });
    return NextResponse.json({ document });
  }

  const patch: Record<string, unknown> = {};
  let renamed = false;
  if (typeof body?.name === "string" && body.name.trim()) {
    patch.name = body.name.trim();
    renamed = true;
  }
  if (typeof body?.description === "string" || body?.description === null) {
    patch.description = body.description || null;
  }
  if (typeof body?.confidential === "boolean") {
    patch.confidential = body.confidential;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "name, description, confidential, restore or file required" }, { status: 400 });
  }

  const { data: document, error } = await supabase
    .from("ops_documents")
    .update(patch)
    .eq("id", id)
    .select(CURRENT_VERSION_SELECT)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actor_email: guard.email,
    action: renamed ? "rename" : "update",
    target_type: "document",
    target_id: id,
    detail: patch,
  });

  return NextResponse.json({ document });
}

// DELETE /ops/api/documents/[id] — soft delete (recoverable via
// PATCH { restore: true }). The storage objects are kept so restore is lossless.
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: document, error } = await supabase
    .from("ops_documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select(CURRENT_VERSION_SELECT)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actor_email: guard.email,
    action: "delete",
    target_type: "document",
    target_id: id,
  });

  return NextResponse.json({ document });
}
