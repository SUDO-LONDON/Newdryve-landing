import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/ops/audit";
import type { OpsExpense } from "@/lib/ops/types";

const FUNDING_KEY = "funding_total_pence";

async function readFundingPence(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<number> {
  const { data } = await supabase
    .from("ops_settings")
    .select("value")
    .eq("key", FUNDING_KEY)
    .maybeSingle();
  return Number(data?.value ?? 0) || 0;
}

// GET /ops/api/finance — funding total, expenses, and derived totals.
export async function GET() {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const supabase = await createSupabaseServerClient();
  const [fundingPence, expensesRes] = await Promise.all([
    readFundingPence(supabase),
    supabase
      .from("ops_expenses")
      .select("*")
      .is("deleted_at", null)
      .order("spent_on", { ascending: false }),
  ]);

  if (expensesRes.error) {
    return NextResponse.json({ error: expensesRes.error.message }, { status: 500 });
  }

  const expenses = (expensesRes.data ?? []) as unknown as OpsExpense[];
  const spentPence = expenses.reduce((sum, e) => sum + Number(e.amount_pence || 0), 0);

  return NextResponse.json({
    fundingPence,
    spentPence,
    remainingPence: fundingPence - spentPence,
    expenses,
  });
}

// PATCH /ops/api/finance  { fundingPounds } — any founder may adjust the total.
export async function PATCH(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const body = await req.json().catch(() => null);
  const pounds = Number(body?.fundingPounds);
  if (!Number.isFinite(pounds) || pounds < 0) {
    return NextResponse.json({ error: "fundingPounds must be a non-negative number" }, { status: 400 });
  }
  const fundingPence = Math.round(pounds * 100);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("ops_settings")
    .upsert({ key: FUNDING_KEY, value: fundingPence, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actor_email: guard.email,
    action: "update",
    target_type: "setting",
    target_id: FUNDING_KEY,
    detail: { funding_pence: fundingPence },
  });

  return NextResponse.json({ fundingPence });
}
