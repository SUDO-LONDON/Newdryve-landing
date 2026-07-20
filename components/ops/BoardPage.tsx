import { notFound } from "next/navigation";
import Board from "@/components/ops/Board";
import { getBoard, getFounders } from "@/lib/ops/config";
import { createSupabaseServerClient, getSessionEmail } from "@/lib/supabase/server";
import type { OpsItem } from "@/lib/ops/types";

// Server component that loads a board's config, items, founders and the
// caller's saved view, then renders the generic Board. Every module route page
// is a one-liner over this.
export default async function BoardPage({
  boardId,
  expectedModule,
}: {
  boardId: string;
  expectedModule?: string;
}) {
  const cfg = await getBoard(boardId);
  if (!cfg) notFound();
  if (expectedModule && cfg.board.module !== expectedModule) notFound();

  const supabase = await createSupabaseServerClient();
  const email = await getSessionEmail();

  const [{ data: items }, founders, prefs] = await Promise.all([
    supabase
      .from("ops_items")
      .select("*")
      .eq("board_id", boardId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    getFounders(),
    email
      ? supabase
          .from("ops_user_prefs")
          .select("view")
          .eq("user_email", email)
          .eq("board_id", boardId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <Board
      board={cfg.board}
      fields={cfg.fields}
      founders={founders}
      initialItems={(items ?? []) as unknown as OpsItem[]}
      initialView={(prefs?.data?.view as Record<string, unknown> | undefined) ?? null}
    />
  );
}
