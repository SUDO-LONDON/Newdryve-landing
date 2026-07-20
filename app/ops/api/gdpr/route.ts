import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/ops/audit";
import type { OpsItem } from "@/lib/ops/types";

// POST /ops/api/gdpr  { item_id }
// GDPR right-to-erasure: hard-deletes an ops_items row via the service-role
// client, bypassing the append-only soft-delete path entirely. FK cascades
// (see 0001_ops_schema.sql) remove ops_notes and ops_activity rows tied to the
// item too, so that individual's personal data is scrubbed from the activity
// log as well as the record itself. This is intentionally irreversible — no
// UI wiring, called only when a data-subject erasure request is confirmed.
export async function POST(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const body = await req.json().catch(() => null);
  const itemId: string | undefined = body?.item_id;
  if (!itemId || typeof itemId !== "string") {
    return NextResponse.json({ error: "item_id required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: existing, error: findError } = await admin
    .from("ops_items")
    .select("*")
    .eq("id", itemId)
    .maybeSingle();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const boardId = (existing as OpsItem).board_id;

  const { error: deleteError } = await admin.from("ops_items").delete().eq("id", itemId);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  await logAudit({
    actor_email: guard.email,
    action: "gdpr_delete",
    target_type: "item",
    target_id: itemId,
    detail: { board_id: boardId },
  });

  return NextResponse.json({ ok: true });
}
