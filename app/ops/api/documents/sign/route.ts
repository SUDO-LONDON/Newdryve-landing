import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/ops/audit";

const SIGNED_URL_EXPIRY_SECONDS = 60;

// POST /ops/api/documents/sign  { version_id } | { path }
// Generates a short-lived signed URL for a single object in the private
// 'data-room' bucket via the service-role client. The requested path/version
// is always resolved against ops_document_versions under the caller's founder
// RLS session first — never signs an arbitrary caller-supplied path — so this
// endpoint cannot be used to fish for objects outside the catalogued set.
export async function POST(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const body = await req.json().catch(() => null);
  const versionId = typeof body?.version_id === "string" ? body.version_id : null;
  const path = typeof body?.path === "string" ? body.path : null;
  if (!versionId && !path) {
    return NextResponse.json({ error: "version_id or path required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("ops_document_versions").select("id, document_id, storage_path");
  query = versionId ? query.eq("id", versionId) : query.eq("storage_path", path as string);

  const { data: version, error } = await query.maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!version) return NextResponse.json({ error: "version not found" }, { status: 404 });

  const admin = createSupabaseAdminClient();
  const { data: signed, error: signErr } = await admin.storage
    .from("data-room")
    .createSignedUrl(version.storage_path, SIGNED_URL_EXPIRY_SECONDS);
  if (signErr || !signed) {
    return NextResponse.json({ error: signErr?.message ?? "failed to sign url" }, { status: 500 });
  }

  await logAudit({
    actor_email: guard.email,
    action: "download",
    target_type: "document",
    target_id: version.document_id,
    detail: { version_id: version.id, path: version.storage_path },
  });

  return NextResponse.json({ url: signed.signedUrl });
}
