// Founder dashboard: makes the current bottleneck obvious at a glance,
// surfaces overdue work across every board, and upcoming funding deadlines.
import Link from "next/link";
import { createSupabaseServerClient, getSessionEmail } from "@/lib/supabase/server";
import { getBoards, getFounders } from "@/lib/ops/config";
import { boardBasePath } from "@/lib/ops/types";
import type { OpsExpense, OpsField, OpsItem, OpsKpi } from "@/lib/ops/types";
import { isCeoEmail } from "@/lib/ops/env";
import { itemValue, primaryFieldKey } from "@/components/ops/format";
import FinancePanel from "@/components/ops/FinancePanel";
import KpiPanel from "@/components/ops/KpiPanel";

export const dynamic = "force-dynamic";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function boardHref(boardId: string): string {
  const base = boardBasePath(boardId);
  return base ? `${base}/${boardId}` : "/ops";
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const today = todayISO();

  const [
    boards,
    fieldsRes,
    instructorsRes,
    overdueActionsRes,
    obligationsRes,
    pipelineRes,
    fundingRes,
    expensesRes,
    kpisRes,
    founders,
    email,
  ] = await Promise.all([
      getBoards(),
      supabase
        .from("ops_fields")
        .select("board_id,key,type,required,position")
        .order("position", { ascending: true }),
      supabase
        .from("ops_items")
        .select("stage,data")
        .eq("board_id", "instructors")
        .is("deleted_at", null),
      supabase
        .from("ops_items")
        .select("id,board_id,stage,next_action,next_action_date,data,updated_at")
        .is("deleted_at", null)
        .not("next_action_date", "is", null)
        .lt("next_action_date", today)
        .order("next_action_date", { ascending: true }),
      supabase
        .from("ops_items")
        .select("id,board_id,stage,data,updated_at")
        .eq("board_id", "obligations")
        .is("deleted_at", null),
      supabase
        .from("ops_items")
        .select("id,board_id,stage,data,updated_at")
        .eq("board_id", "pipeline")
        .is("deleted_at", null),
      supabase.from("ops_settings").select("value").eq("key", "funding_total_pence").maybeSingle(),
      supabase
        .from("ops_expenses")
        .select("*")
        .is("deleted_at", null)
        .order("spent_on", { ascending: false }),
      supabase
        .from("ops_kpis")
        .select("*")
        .is("deleted_at", null)
        .order("week_start", { ascending: false })
        .order("created_at", { ascending: true }),
      getFounders(),
      getSessionEmail(),
    ]);

  const fundingPence = Number(fundingRes.data?.value ?? 0) || 0;
  const expenses = (expensesRes.data ?? []) as unknown as OpsExpense[];
  const kpis = (kpisRes.data ?? []) as unknown as OpsKpi[];
  const currentEmail = email ?? "";
  const isCeo = isCeoEmail(currentEmail);

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

  const instructorBoard = boards.find((b) => b.id === "instructors");
  const instructors = (instructorsRes.data ?? []) as unknown as OpsItem[];
  const stageOrder = instructorBoard?.stages ?? [];
  const stageCounts = stageOrder.map((stage) => ({
    stage,
    count: instructors.filter((i) => i.stage === stage).length,
  }));
  const maxStageCount = Math.max(1, ...stageCounts.map((s) => s.count));
  const activeCount = instructors.filter((i) => i.stage === "Active").length;
  const payingCount = instructors.filter((i) => i.data?.subscription_status === "Paying").length;

  const overdueActions = (overdueActionsRes.data ?? []) as unknown as OpsItem[];
  const obligations = (obligationsRes.data ?? []) as unknown as OpsItem[];
  const overdueObligations = obligations
    .filter((o) => {
      const due = o.data?.due_date as string | undefined;
      return !!due && due < today && o.stage !== "Complete";
    })
    .sort((a, b) => String(a.data?.due_date).localeCompare(String(b.data?.due_date)));

  type OverdueRow = { item: OpsItem; date: string; label: string; isObligation: boolean };
  const overdueRows: OverdueRow[] = [
    ...overdueObligations.map((item) => ({
      item,
      date: String(item.data?.due_date ?? ""),
      label: String(item.data?.obligation ?? titleFor(item)),
      isObligation: true,
    })),
    ...overdueActions.map((item) => ({
      item,
      date: String(item.next_action_date ?? ""),
      label: item.next_action ?? titleFor(item),
      isObligation: false,
    })),
  ];
  const overdueTotal = overdueRows.length;

  const upcomingObligations = obligations
    .filter((o) => {
      const due = o.data?.due_date as string | undefined;
      return !!due && due >= today && o.stage !== "Complete";
    })
    .sort((a, b) => String(a.data?.due_date).localeCompare(String(b.data?.due_date)));

  const pipeline = (pipelineRes.data ?? []) as unknown as OpsItem[];
  type DeadlineRow = { item: OpsItem; date: string; label: string };
  const pipelineDeadlines: DeadlineRow[] = [];
  for (const p of pipeline) {
    const deadline = p.data?.application_deadline as string | undefined;
    const pitch = p.data?.pitch_date as string | undefined;
    if (deadline && deadline >= today) {
      pipelineDeadlines.push({
        item: p,
        date: deadline,
        label: `${titleFor(p)} - application deadline`,
      });
    }
    if (pitch && pitch >= today) {
      pipelineDeadlines.push({ item: p, date: pitch, label: `${titleFor(p)} - pitch` });
    }
  }

  const upcomingRows: DeadlineRow[] = [
    ...upcomingObligations.map((item) => ({
      item,
      date: String(item.data?.due_date ?? ""),
      label: String(item.data?.obligation ?? titleFor(item)),
    })),
    ...pipelineDeadlines,
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Snapshot as of {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          .
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Instructors - Active" value={activeCount} />
        <StatTile label="Instructors - Paying" value={payingCount} accent="racing-green" />
        <StatTile label="Overdue (all boards)" value={overdueTotal} accent={overdueTotal > 0 ? "deep-rose" : undefined} />
        <StatTile label="Upcoming obligations" value={upcomingObligations.length} />
      </div>

      <section className="rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Instructor pipeline</h2>
          <Link href={boardHref("instructors")} className="text-sm text-racing-green hover:underline">
            View board -&gt;
          </Link>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Supply-side is the current bottleneck. {instructors.length} instructors tracked.
        </p>
        <div className="mt-4 space-y-2">
          {stageCounts.map(({ stage, count }) => (
            <div key={stage} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-xs text-ink-secondary">{stage}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-blush-surface">
                <div
                  className="h-full rounded-full bg-racing-green"
                  style={{ width: `${(count / maxStageCount) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-xs font-medium text-ink">{count}</span>
            </div>
          ))}
          {stageCounts.length === 0 && <p className="text-sm text-ink-muted">No stages configured.</p>}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Overdue</h2>
            <Link href="/ops/due" className="text-sm text-racing-green hover:underline">
              Full due/overdue view -&gt;
            </Link>
          </div>
          <p className="mt-1 text-xs text-ink-muted">{overdueTotal} item(s) past their date.</p>
          <ul className="mt-3 space-y-2">
            {overdueRows.slice(0, 8).map((r, idx) => (
              <li key={`${r.item.id}-${idx}`}>
                <Link
                  href={boardHref(r.item.board_id)}
                  className="flex items-start justify-between gap-3 rounded-lg border border-blush-border bg-blush-surface px-3 py-2 hover:bg-blush-surface/70"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink">{r.label || "Untitled"}</span>
                    <span className="text-xs text-ink-muted">
                      {boardName(r.item.board_id)}
                      {r.isObligation ? " - obligation" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-deep-rose">
                    {new Date(r.date).toLocaleDateString("en-GB")}
                  </span>
                </Link>
              </li>
            ))}
            {overdueRows.length === 0 && <p className="text-sm text-ink-muted">Nothing overdue.</p>}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-display text-lg text-ink">Upcoming funding deadlines</h2>
          <p className="mt-1 text-xs text-ink-muted">Soonest first.</p>
          <ul className="mt-3 space-y-2">
            {upcomingRows.map((r, idx) => (
              <li key={`${r.item.id}-${idx}`}>
                <Link
                  href={boardHref(r.item.board_id)}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2 hover:bg-blush-surface/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink">{r.label}</span>
                    <span className="text-xs text-ink-muted">{boardName(r.item.board_id)}</span>
                  </span>
                  <span className="shrink-0 text-xs text-ink-secondary">
                    {new Date(r.date).toLocaleDateString("en-GB")}
                  </span>
                </Link>
              </li>
            ))}
            {upcomingRows.length === 0 && (
              <p className="text-sm text-ink-muted">No upcoming obligations or deadlines.</p>
            )}
          </ul>
        </section>
      </div>

      <FinancePanel initialFundingPence={fundingPence} initialExpenses={expenses} />

      <KpiPanel
        initialKpis={kpis}
        founders={founders}
        isCeo={isCeo}
        currentEmail={currentEmail}
      />
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "racing-green" | "deep-rose";
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p
        className={`mt-1 font-display text-2xl ${
          accent === "racing-green" ? "text-racing-green" : accent === "deep-rose" ? "text-deep-rose" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
