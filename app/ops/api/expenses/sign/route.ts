import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/ops/audit";

const SIGNED_URL_EXPIRY_SECONDS = 60;

// POST /ops/api/expenses/sign  { id } — short-lived signed URL for an
// expense's receipt. The path is resolved from ops_expenses under the caller's
// founder RLS session, never taken directly from the client.
export async function POST(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: expense, error } = await supabase
    .from("ops_expenses")
    .select("id, receipt_path")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!expense?.receipt_path) return NextResponse.json({ error: "not found" }, { status: 404 });

  const admin = createSupabaseAdminClient();
  const { data: signed, error: signErr } = await admin.storage
    .from("receipts")
    .createSignedUrl(expense.receipt_path as string, SIGNED_URL_EXPIRY_SECONDS);
  if (signErr || !signed) {
    return NextResponse.json({ error: signErr?.message ?? "failed to sign url" }, { status: 500 });
  }

  await logAudit({
    actor_email: guard.email,
    action: "download",
    target_type: "expense",
    target_id: id,
    detail: { path: expense.receipt_path },
  });

  return NextResponse.json({ url: signed.signedUrl });
}
