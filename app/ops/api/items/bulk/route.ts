import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setItemDeleted, updateItem } from "@/lib/ops/items";

// POST /ops/api/items/bulk  { ids: string[], action: 'stage'|'owner'|'delete', value? }
export async function POST(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  const action: string = body?.action;
  const value: unknown = body?.value;
  if (!ids.length || !action) {
    return NextResponse.json({ error: "ids and action required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  try {
    for (const id of ids) {
      if (action === "delete") {
        await setItemDeleted(supabase, id, true, guard.email);
      } else if (action === "stage") {
        await updateItem(supabase, id, { stage: value }, guard.email);
      } else if (action === "owner") {
        await updateItem(supabase, id, { owner: value }, guard.email);
      } else {
        return NextResponse.json({ error: `unknown action ${action}` }, { status: 400 });
      }
    }
    return NextResponse.json({ ok: true, count: ids.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
