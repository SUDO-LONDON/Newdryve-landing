import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createItem } from "@/lib/ops/items";

// GET /ops/api/items?board_id=instructors[&include_deleted=1]
export async function GET(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const boardId = req.nextUrl.searchParams.get("board_id");
  if (!boardId) return NextResponse.json({ error: "board_id required" }, { status: 400 });
  const includeDeleted = req.nextUrl.searchParams.get("include_deleted") === "1";

  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("ops_items")
    .select("*")
    .eq("board_id", boardId)
    .order("updated_at", { ascending: false });
  if (!includeDeleted) q = q.is("deleted_at", null);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// POST /ops/api/items  { board_id, values }
export async function POST(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const body = await req.json().catch(() => null);
  const boardId = body?.board_id;
  const values = body?.values;
  if (!boardId || typeof values !== "object" || values === null) {
    return NextResponse.json({ error: "board_id and values required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  try {
    const item = await createItem(supabase, boardId, values, guard.email);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
