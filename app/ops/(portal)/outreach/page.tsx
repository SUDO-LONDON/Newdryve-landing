// Outreach: the nine CRM boards on one page, grouped the way the sidebar
// groups them, each with what it is for and how much is on it. Open a board
// from here; the boards themselves are unchanged.
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBoards } from "@/lib/ops/config";
import { BOARD_NAV } from "@/lib/ops/types";
import { OUTREACH } from "@/lib/ops/nav";

export const dynamic = "force-dynamic";

const MODULE_BLURB: Record<string, string> = {
  customer_outreach: "Instructors and learners we want on Newdryve, and partners who can bring them.",
  marketing_outreach: "Creators, press and campaigns that get the name out.",
  investor_outreach: "Grants, investors and the obligations that come with their money.",
};

export default async function OutreachPage() {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);
  const [boards, itemsRes] = await Promise.all([
    getBoards(),
    supabase.from("ops_items").select("board_id,next_action_date").is("deleted_at", null),
  ]);
  const items = (itemsRes.data ?? []) as Array<{ board_id: string; next_action_date: string | null }>;
  const counts = new Map<string, { total: number; overdue: number }>();
  for (const i of items) {
    const c = counts.get(i.board_id) ?? { total: 0, overdue: 0 };
    c.total += 1;
    if (i.next_action_date && i.next_action_date < today) c.overdue += 1;
    counts.set(i.board_id, c);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ink">{OUTREACH.label}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-secondary">{OUTREACH.blurb}</p>
      </div>

      {BOARD_NAV.map((m) => (
        <section key={m.module} aria-labelledby={`module-${m.module}`}>
          <h2 id={`module-${m.module}`} className="font-display text-lg text-ink">
            {m.moduleName}
          </h2>
          <p className="mt-0.5 text-sm text-ink-secondary">{MODULE_BLURB[m.module]}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {m.boards.map((b) => {
              const board = boards.find((x) => x.id === b.id);
              const c = counts.get(b.id) ?? { total: 0, overdue: 0 };
              return (
                <Link
                  key={b.id}
                  href={`${m.basePath}/${b.id}`}
                  className="rounded-xl border border-border bg-white p-4 transition hover:border-blush-border hover:shadow-sm"
                >
                  <p className="font-medium text-ink">{board?.name ?? b.name}</p>
                  {board?.description && <p className="mt-1 text-sm text-ink-secondary">{board.description}</p>}
                  <p className="mt-3 text-xs text-ink-muted">
                    {c.total} {c.total === 1 ? "item" : "items"}
                    {c.overdue > 0 && <span className="text-deep-rose"> · {c.overdue} overdue</span>}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
