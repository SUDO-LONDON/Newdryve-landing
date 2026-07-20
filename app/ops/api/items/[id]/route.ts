import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setItemDeleted, updateItem } from "@/lib/ops/items";
import { logAudit } from "@/lib/ops/audit";
import type { OpsItem } from "@/lib/ops/types";

type Ctx = { params: Promise<{ id: string }> };

// GET one item with its notes + activity (drawer). Reveals full record
// including personal data, so this access is written to the audit log.
export async function GET(_req: NextRequest, { params }: Ctx) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const [{ data: item, error }, { data: notes }, { data: activity }] = await Promise.all([
    supabase.from("ops_items").select("*").eq("id", id).maybeSingle(),
    supabase.from("ops_notes").select("*").eq("item_id", id).order("created_at", { ascending: false }),
    supabase.from("ops_activity").select("*").eq("item_id", id).order("created_at", { ascending: false }),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });

  await logAudit({
    actor_email: guard.email,
    action: "view_personal_data",
    target_type: "item",
    target_id: id,
    detail: { board_id: (item as OpsItem).board_id },
  });

  return NextResponse.json({ item, notes: notes ?? [], activity: activity ?? [] });
}

// PATCH: inline edit ({ values }) or restore ({ restore: true }).
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const supabase = await createSupabaseServerClient();

  try {
    if (body?.restore === true) {
      const item = await setItemDeleted(supabase, id, false, guard.email);
      return NextResponse.json({ item });
    }
    if (body?.values && typeof body.values === "object") {
      const item = await updateItem(supabase, id, body.values, guard.email);
      return NextResponse.json({ item });
    }
    return NextResponse.json({ error: "values or restore required" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// DELETE: soft delete (recoverable via PATCH { restore: true }).
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  try {
    const item = await setItemDeleted(supabase, id, true, guard.email);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
