import "server-only";

// Server-side helpers to read board/field configuration and the founder list
// from Postgres. All queries run under the caller's RLS session.
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Founder, OpsBoard, OpsField } from "@/lib/ops/types";

export async function getBoards(): Promise<OpsBoard[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ops_boards")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as OpsBoard[];
}

export async function getBoard(
  boardId: string
): Promise<{ board: OpsBoard; fields: OpsField[] } | null> {
  const supabase = await createSupabaseServerClient();
  const [{ data: board }, { data: fields }] = await Promise.all([
    supabase.from("ops_boards").select("*").eq("id", boardId).maybeSingle(),
    supabase
      .from("ops_fields")
      .select("*")
      .eq("board_id", boardId)
      .order("position", { ascending: true }),
  ]);
  if (!board) return null;
  return {
    board: board as unknown as OpsBoard,
    fields: (fields ?? []) as unknown as OpsField[],
  };
}

export async function getFounders(): Promise<Founder[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ops_allowlist")
    .select("email, name, role")
    .order("role", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Founder[];
}
