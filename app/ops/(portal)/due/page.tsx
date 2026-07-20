// Consolidated "Due & Overdue" view: every board's dated items in one
// chronological list, flagged OVERDUE vs UPCOMING. Obligations surface first
// within the overdue group since missing them carries the highest consequence
// (repayment risk on funding already received).
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBoards } from "@/lib/ops/config";
import { boardBasePath } from "@/lib/ops/types";
import type { OpsField, OpsItem } from "@/lib/ops/types";
import { itemValue, primaryFieldKey } from "@/components/ops/format";

export const dynamic = "force-dynamic";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function boardHref(boardId: string): string {
  const base = boardBasePath(boardId);
  return base ? `${base}/${boardId}` : "/ops";
}

interface Row {
  item: OpsItem;
  date: string;
  title: string;
  detail: string;
  isObligation: boolean;
}

export default async function DuePage() {
  const supabase = await createSupabaseServerClient();
  const today = todayISO();

  const [boards, fieldsRes, dueActionsRes, obligationsRes] = await Promise.all([
    getBoards(),
    supabase.from("ops_fields").select("*").order("position", { ascending: true }),
    supabase
      .from("ops_items")
      .select("*")
      .is("deleted_at", null)
      .not("next_action_date", "is", null),
    supabase.from("ops_items").select("*").eq("board_id", "obligations").is("deleted_at", null),
  ]);

  const boardName = (id: string) => boards.find((b) => b.id === id)?.name ?? id;

  const fieldsByBoard = new Map<string, OpsField[]>();
  for (const f of (fieldsRes.data ?? []) as unknown as OpsField[]) {
    const list = fieldsByBoard.get(f.board_id) ?? [];
    list.push(f);
    fieldsByBoard.set(f.board_id, list);
  }
  const titleFor = (item: OpsItem) => {
    const fields = fieldsByBoard.get(item.board_id) ?? [];
    const key = primaryFieldKey(fields);
    return String(itemValue(item, key) ?? "Untitled");
  };

  const dueActions = (dueActionsRes.data ?? []) as unknown as OpsItem[];
  const obligations = (obligationsRes.data ?? []) as unknown as OpsItem[];

  const obligationRows: Row[] = obligations
    .filter((item) => !!item.data?.due_date)
    .map((item) => ({
      item,
      date: String(item.data?.due_date ?? ""),
      title: titleFor(item),
      detail: String(item.data?.obligation ?? ""),
      isObligation: true,
    }));

  const actionRows: Row[] = dueActions.map((item) => ({
    item,
    date: String(item.next_action_date ?? ""),
    title: titleFor(item),
    detail: item.next_action ?? "",
    isObligation: false,
  }));

  const overdue = [...obligationRows, ...actionRows]
    .filter((r) => r.date < today)
    .sort((a, b) => {
      if (a.isObligation !== b.isObligation) return a.isObligation ? -1 : 1;
      return a.date.localeCompare(b.date);
    });

  const upcoming = [...obligationRows, ...actionRows]
    .filter((r) => r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ink">Due &amp; Overdue</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Every dated action and funding obligation across all boards, in one place.
        </p>
      </div>

      <section>
        <h2 className="font-display text-lg text-deep-rose">Overdue ({overdue.length})</h2>
        <DueTable rows={overdue} boardName={boardName} tone="overdue" />
      </section>

      <section>
        <h2 className="font-display text-lg text-ink">Upcoming ({upcoming.length})</h2>
        <DueTable rows={upcoming} boardName={boardName} tone="upcoming" />
      </section>
    </div>
  );
}

function DueTable({
  rows,
  boardName,
  tone,
}: {
  rows: Row[];
  boardName: (id: string) => string;
  tone: "overdue" | "upcoming";
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-3 rounded-xl border border-border bg-white p-4 text-sm text-ink-muted">
        {tone === "overdue" ? "Nothing overdue." : "Nothing upcoming."}
      </p>
    );
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-ink-secondary">
            <th className="px-3 py-2 font-medium whitespace-nowrap">Board</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Item</th>
            <th className="px-3 py-2 font-medium">Next action / obligation</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Date</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`${r.item.id}-${idx}`} className="border-b border-border/60 hover:bg-blush-surface/40">
              <td className="px-3 py-2 whitespace-nowrap">
                <Link href={boardHref(r.item.board_id)} className="text-racing-green hover:underline">
                  {boardName(r.item.board_id)}
                </Link>
              </td>
              <td className="px-3 py-2 max-w-[16rem] truncate text-ink" title={r.title}>
                {r.title}
              </td>
              <td className="px-3 py-2 max-w-[24rem] truncate text-ink-secondary" title={r.detail}>
                {r.detail || "—"}
              </td>
              <td
                className={`px-3 py-2 whitespace-nowrap font-medium ${
                  tone === "overdue" ? "text-deep-rose" : "text-ink"
                }`}
              >
                {r.date ? new Date(r.date).toLocaleDateString("en-GB") : "—"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-xs text-ink-muted">
                {r.isObligation ? "Obligation" : "Next action"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
