// Money: funding in, spend out (every spend has a receipt), and what is owed
// back. The spend panel used to sit at the bottom of the dashboard; it is a
// place of its own so it can be found.
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { boardBasePath } from "@/lib/ops/types";
import type { OpsExpense, OpsItem } from "@/lib/ops/types";
import FinancePanel from "@/components/ops/FinancePanel";

export const dynamic = "force-dynamic";

export default async function MoneyPage() {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);

  const [fundingRes, expensesRes, obligationsRes] = await Promise.all([
    supabase.from("ops_settings").select("value").eq("key", "funding_total_pence").maybeSingle(),
    supabase.from("ops_expenses").select("*").is("deleted_at", null).order("spent_on", { ascending: false }),
    supabase.from("ops_items").select("id,board_id,stage,data,updated_at").eq("board_id", "obligations").is("deleted_at", null),
  ]);

  const fundingPence = Number(fundingRes.data?.value ?? 0) || 0;
  const expenses = (expensesRes.data ?? []) as unknown as OpsExpense[];
  const obligations = ((obligationsRes.data ?? []) as unknown as OpsItem[])
    .filter((o) => typeof o.data?.due_date === "string" && o.stage !== "Complete")
    .sort((a, b) => String(a.data.due_date).localeCompare(String(b.data.due_date)));
  const obligationsHref = `${boardBasePath("obligations") ?? "/ops/investors"}/obligations`;
  const fundingHref = `${boardBasePath("pipeline") ?? "/ops/investors"}/pipeline`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ink">Money</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-secondary">
          Funding received, every spend with its receipt, and the obligations that come with the funding.
        </p>
      </div>

      <FinancePanel initialFundingPence={fundingPence} initialExpenses={expenses} />

      <section className="rounded-2xl border border-border bg-white p-5" aria-labelledby="obligations-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="obligations-heading" className="font-display text-lg text-ink">
            Obligations
          </h2>
          <Link href={obligationsHref} className="text-sm text-racing-green hover:underline">
            Open the board →
          </Link>
        </div>
        <p className="mt-1 text-xs text-ink-muted">What funders expect back, soonest first. Missing one risks repayment.</p>
        <ul className="mt-3 space-y-2">
          {obligations.slice(0, 8).map((o) => {
            const due = String(o.data.due_date);
            const late = due < today;
            return (
              <li key={o.id} className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">{String(o.data.obligation ?? "Obligation")}</span>
                  <span className="text-xs text-ink-muted">{o.stage ?? "No stage"}</span>
                </span>
                <span className={`shrink-0 text-xs font-medium ${late ? "text-deep-rose" : "text-ink-secondary"}`}>
                  {late ? "Overdue · " : ""}
                  {new Date(due).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </li>
            );
          })}
          {obligations.length === 0 && <li className="text-sm text-ink-muted">No open obligations.</li>}
        </ul>
        <p className="mt-4 text-sm text-ink-secondary">
          Looking for grants and investors being chased? That is the{" "}
          <Link href={fundingHref} className="text-racing-green hover:underline">
            Funding pipeline
          </Link>{" "}
          board under Outreach.
        </p>
      </section>
    </div>
  );
}
