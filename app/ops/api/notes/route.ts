import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addNote } from "@/lib/ops/items";

// GET /ops/api/notes?item_id=...
export async function GET(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const itemId = req.nextUrl.searchParams.get("item_id");
  if (!itemId) return NextResponse.json({ error: "item_id required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ops_notes")
    .select("*")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data ?? [] });
}

// POST /ops/api/notes  { item_id, body }
export async function POST(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const body = await req.json().catch(() => null);
  const itemId = body?.item_id;
  const text = (body?.body ?? "").toString().trim();
  if (!itemId || !text) {
    return NextResponse.json({ error: "item_id and body required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  try {
    const note = await addNote(supabase, itemId, text, guard.email);
    return NextResponse.json({ note });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
