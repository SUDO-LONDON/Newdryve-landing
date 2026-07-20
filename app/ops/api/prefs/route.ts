import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Persists the founder's last-used view (mode/sort/filters) per board.
export async function GET(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const boardId = req.nextUrl.searchParams.get("board_id");
  if (!boardId) return NextResponse.json({ error: "board_id required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ops_user_prefs")
    .select("view")
    .eq("user_email", guard.email)
    .eq("board_id", boardId)
    .maybeSingle();
  return NextResponse.json({ view: data?.view ?? null });
}

export async function PUT(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const body = await req.json().catch(() => null);
  const boardId = body?.board_id;
  const view = body?.view;
  if (!boardId || typeof view !== "object") {
    return NextResponse.json({ error: "board_id and view required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("ops_user_prefs")
    .upsert(
      { user_email: guard.email, board_id: boardId, view, updated_at: new Date().toISOString() },
      { onConflict: "user_email,board_id" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
