import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireCeo, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isCeoEmail } from "@/lib/ops/env";
import { logAudit } from "@/lib/ops/audit";
import type { OpsKpi } from "@/lib/ops/types";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /ops/api/kpis/[id]
//   { done: boolean }                     → tick/untick (CEO or the assignee)
//   { title?, detail?, assignee_email? }  → edit (CEO only)
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: findErr } = await supabase
    .from("ops_kpis")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const kpi = existing as unknown as OpsKpi;
  const isCeo = isCeoEmail(guard.email);
  const isAssignee = kpi.assignee_email.toLowerCase() === guard.email.toLowerCase();

  const wantsContentEdit =
    "title" in body || "detail" in body || "assignee_email" in body || "week_start" in body;
  const wantsDoneToggle = "done" in body;

  // Content edits are CEO-only; anyone else may only toggle their own KPI.
  if (wantsContentEdit && !isCeo) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (wantsDoneToggle && !isCeo && !isAssignee) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const update: Record<string, unknown> = {};
  if (wantsDoneToggle) {
    const done = Boolean(body.done);
    update.done = done;
    update.done_at = done ? new Date().toISOString() : null;
  }
  if (isCeo) {
    if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
    if ("detail" in body) update.detail = typeof body.detail === "string" && body.detail.trim() ? body.detail.trim() : null;
    if (typeof body.assignee_email === "string" && body.assignee_email.trim()) {
      update.assignee_email = body.assignee_email.trim().toLowerCase();
    }
    if (typeof body.week_start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.week_start)) {
      update.week_start = body.week_start;
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const { data: updated, error: updErr } = await supabase
    .from("ops_kpis")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  await logAudit({
    actor_email: guard.email,
    action: wantsDoneToggle && !wantsContentEdit ? "kpi_toggle" : "update",
    target_type: "kpi",
    target_id: id,
    detail: update,
  });

  return NextResponse.json({ kpi: updated });
}

// DELETE /ops/api/kpis/[id] — CEO only (soft delete).
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await requireCeo();
  if (isGuardError(guard)) return guard.error;
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("ops_kpis")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ actor_email: guard.email, action: "delete", target_type: "kpi", target_id: id });
  return NextResponse.json({ ok: true });
}
