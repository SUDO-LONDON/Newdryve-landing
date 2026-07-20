import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireCeo, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFounderEmail } from "@/lib/ops/env";
import { logAudit } from "@/lib/ops/audit";

// GET /ops/api/kpis[?week_start=][&assignee=] — founders see all KPIs.
export async function GET(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const weekStart = req.nextUrl.searchParams.get("week_start")?.trim();
  const assignee = req.nextUrl.searchParams.get("assignee")?.trim();

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("ops_kpis")
    .select("*")
    .is("deleted_at", null)
    .order("week_start", { ascending: false })
    .order("assignee_email", { ascending: true })
    .order("created_at", { ascending: true });
  if (weekStart) query = query.eq("week_start", weekStart);
  if (assignee) query = query.eq("assignee_email", assignee);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kpis: data ?? [] });
}

// POST /ops/api/kpis  { week_start, assignee_email, title, detail? } — CEO only.
export async function POST(req: NextRequest) {
  const guard = await requireCeo();
  if (isGuardError(guard)) return guard.error;

  const body = await req.json().catch(() => null);
  const weekStart = String(body?.week_start ?? "").trim();
  const assigneeEmail = String(body?.assignee_email ?? "").trim().toLowerCase();
  const title = String(body?.title ?? "").trim();
  const detail = typeof body?.detail === "string" && body.detail.trim() ? body.detail.trim() : null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json({ error: "week_start must be YYYY-MM-DD" }, { status: 400 });
  }
  if (!assigneeEmail || !isFounderEmail(assigneeEmail)) {
    return NextResponse.json({ error: "assignee_email must be an allowlisted founder" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: kpi, error } = await supabase
    .from("ops_kpis")
    .insert({
      week_start: weekStart,
      assignee_email: assigneeEmail,
      title,
      detail,
      created_by: guard.email,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actor_email: guard.email,
    action: "create",
    target_type: "kpi",
    target_id: kpi.id as string,
    detail: { week_start: weekStart, assignee_email: assigneeEmail, title },
  });

  return NextResponse.json({ kpi });
}
