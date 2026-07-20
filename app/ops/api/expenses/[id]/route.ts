import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/ops/audit";
import type { OpsExpense } from "@/lib/ops/types";

type Ctx = { params: Promise<{ id: string }> };

// DELETE /ops/api/expenses/[id] — soft-deletes the expense and removes its
// receipt object from the private bucket.
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: expense, error: findErr } = await supabase
    .from("ops_expenses")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!expense) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { error: updErr } = await supabase
    .from("ops_expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  const receiptPath = (expense as unknown as OpsExpense).receipt_path;
  if (receiptPath) {
    const admin = createSupabaseAdminClient();
    await admin.storage.from("receipts").remove([receiptPath]).catch(() => {});
  }

  await logAudit({
    actor_email: guard.email,
    action: "delete",
    target_type: "expense",
    target_id: id,
  });

  return NextResponse.json({ ok: true });
}
