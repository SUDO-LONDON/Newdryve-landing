// Today: the one page to open first. What needs you now (overdue work,
// applications waiting, money left, schools), then what is coming up, then a
// map of where everything else lives. Nothing is edited here.
import Link from "next/link";
import { createSupabaseServerClient, getSessionEmail } from "@/lib/supabase/server";
import { getBoards } from "@/lib/ops/config";
import { boardBasePath, formatPence } from "@/lib/ops/types";
import type { OpsField, OpsItem } from "@/lib/ops/types";
import { DUE, OUTREACH, RUN_SECTIONS, TEAM_SECTIONS, type OpsSection } from "@/lib/ops/nav";
import { isInstructorApiConfigured, listInstructorApplications } from "@/lib/ops/instructors";
import { isOrganisationApiConfigured, listOrganisations } from "@/lib/ops/organisations";
import { itemValue, primaryFieldKey } from "@/components/ops/format";

export const dynamic = "force-dynamic";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function boardHref(boardId: string): string {
  const base = boardBasePath(boardId);
  return base ? `${base}/${boardId}` : "/ops/outreach";
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Counts from the Newdryve API; null when it is not configured or did not answer. */
async function liveCounts(email: string): Promise<{ pending: number; awaitingPayment: number; schools: number } | null> {
  if (!isInstructorApiConfigured() || !isOrganisationApiConfigured()) return null;
  try {
    const [pending, awaitingPayment, schools] = await Promise.all([
      listInstructorApplications(email, "pending"),
      listInstructorApplications(email, "payment_pending"),
      listOrganisations(email),
    ]);
    return {
      pending: pending.length,
      awaitingPayment: awaitingPayment.length,
      schools: schools.filter((s) => s.status === "active" && !s.deleted_at).length,
    };
  } catch {
    return null;
  }
}

export default async function TodayPage() {
  const supabase = await createSupabaseServerClient();
  const email = (await getSessionEmail()) || "";
  const today = todayISO();

  const [boards, fieldsRes, overdueActionsRes, obligationsRes, pipelineRes, fundingRes, spendRes, live] = await Promise.all([
    getBoards(),
    supabase.from("ops_fields").select("board_id,key,type,required,position").order("position", { ascending: true }),
    supabase
      .from("ops_items")
      .select("id,board_id,stage,next_action,next_action_date,data,updated_at")
      .is("deleted_at", null)
      .not("next_action_date", "is", null)
      .lt("next_action_date", today)
      .order("next_action_date", { ascending: true }),
    supabase.from("ops_items").select("id,board_id,stage,data,updated_at").eq("board_id", "obligations").is("deleted_at", null),
    supabase.from("ops_items").select("id,board_id,stage,data,updated_at").eq("board_id", "pipeline").is("deleted_at", null),
    supabase.from("ops_settings").select("value").eq("key", "funding_total_pence").maybeSingle(),
    supabase.from("ops_expenses").select("amount_pence").is("deleted_at", null),
    liveCounts(email),
  ]);

  const boardName = (id: string) => boards.find((b) => b.id === id)?.name ?? id;
  const fieldsByBoard = new Map<string, OpsField[]>();
  for (const f of (fieldsRes.data ?? []) as unknown as OpsField[]) {
    const list = fieldsByBoard.get(f.board_id) ?? [];
    list.push(f);
    fieldsByBoard.set(f.board_id, list);
  }
  const titleFor = (item: OpsItem) => String(itemValue(item, primaryFieldKey(fieldsByBoard.get(item.board_id) ?? [])) ?? "Untitled");

  // Overdue: obligations past their date first (missing one risks repayment), then next actions.
  const obligations = (obligationsRes.data ?? []) as unknown as OpsItem[];
  const openObligation = (o: OpsItem) => typeof o.data?.due_date === "string" && o.stage !== "Complete";
  type Row = { item: OpsItem; date: string; label: string; kind: string };
  const overdue: Row[] = [
    ...obligations
      .filter((o) => openObligation(o) && String(o.data.due_date) < today)
      .map((item) => ({ item, date: String(item.data.due_date), label: String(item.data.obligation ?? titleFor(item)), kind: "Obligation" })),
    ...((overdueActionsRes.data ?? []) as unknown as OpsItem[]).map((item) => ({
      item,
      date: String(item.next_action_date ?? ""),
      label: item.next_action ?? titleFor(item),
      kind: boardName(item.board_id),
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const upcoming: Row[] = [
    ...obligations
      .filter((o) => openObligation(o) && String(o.data.due_date) >= today)
      .map((item) => ({ item, date: String(item.data.due_date), label: String(item.data.obligation ?? titleFor(item)), kind: "Obligation" })),
    ...((pipelineRes.data ?? []) as unknown as OpsItem[]).flatMap((p) => {
      const rows: Row[] = [];
      const deadline = p.data?.application_deadline;
      const pitch = p.data?.pitch_date;
      if (typeof deadline === "string" && deadline >= today) rows.push({ item: p, date: deadline, label: `${titleFor(p)}: application deadline`, kind: "Funding" });
      if (typeof pitch === "string" && pitch >= today) rows.push({ item: p, date: pitch, label: `${titleFor(p)}: pitch`, kind: "Funding" });
      return rows;
    }),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const fundingPence = Number(fundingRes.data?.value ?? 0) || 0;
  const spentPence = ((spendRes.data ?? []) as Array<{ amount_pence: number }>).reduce((sum, e) => sum + Number(e.amount_pence || 0), 0);
  const leftPence = fundingPence - spentPence;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ink">Today</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <section aria-labelledby="needs-you">
        <h2 id="needs-you" className="sr-only">
          Needs you
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile
            href={DUE.href}
            label="Overdue"
            value={String(overdue.length)}
            tone={overdue.length ? "bad" : "good"}
            note={overdue.length ? "Past their date. Deal with these first." : "Nothing past its date."}
          />
          <Tile
            href="/ops/instructors"
            label="Applications waiting"
            value={live ? String(live.pending) : "–"}
            tone={live?.pending ? "bad" : "plain"}
            note={live ? `${live.awaitingPayment} approved, awaiting payment` : "Not connected to the API"}
          />
          <Tile
            href="/ops/organisations"
            label="Schools"
            value={live ? String(live.schools) : "–"}
            tone="plain"
            note={live ? "Active on Newdryve" : "Not connected to the API"}
          />
          <Tile
            href="/ops/money"
            label="Money left"
            value={formatPence(leftPence)}
            tone={leftPence < 0 ? "bad" : "good"}
            note={`${formatPence(spentPence)} spent of ${formatPence(fundingPence)}`}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-5" aria-labelledby="overdue-heading">
          <div className="flex items-center justify-between">
            <h2 id="overdue-heading" className="font-display text-lg text-ink">
              Overdue
            </h2>
            <Link href={DUE.href} className="text-sm text-racing-green hover:underline">
              Everything due →
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {overdue.slice(0, 8).map((r, idx) => (
              <li key={`${r.item.id}-${idx}`}>
                <Link
                  href={boardHref(r.item.board_id)}
                  className="flex items-start justify-between gap-3 rounded-lg border border-blush-border bg-blush-surface px-3 py-2 hover:bg-blush-surface/70"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink">{r.label || "Untitled"}</span>
                    <span className="text-xs text-ink-muted">{r.kind}</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-deep-rose">{shortDate(r.date)}</span>
                </Link>
              </li>
            ))}
            {overdue.length === 0 && <li className="text-sm text-ink-muted">Nothing overdue.</li>}
            {overdue.length > 8 && (
              <li className="text-xs text-ink-muted">
                And {overdue.length - 8} more in{" "}
                <Link href={DUE.href} className="text-racing-green hover:underline">
                  Everything due
                </Link>
                .
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5" aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="font-display text-lg text-ink">
            Coming up
          </h2>
          <p className="mt-1 text-xs text-ink-muted">Obligations and funding dates, soonest first.</p>
          <ul className="mt-3 space-y-2">
            {upcoming.map((r, idx) => (
              <li key={`${r.item.id}-${idx}`}>
                <Link
                  href={boardHref(r.item.board_id)}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2 hover:bg-blush-surface/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink">{r.label}</span>
                    <span className="text-xs text-ink-muted">{r.kind}</span>
                  </span>
                  <span className="shrink-0 text-xs text-ink-secondary">{shortDate(r.date)}</span>
                </Link>
              </li>
            ))}
            {upcoming.length === 0 && <li className="text-sm text-ink-muted">Nothing dated in the next while.</li>}
          </ul>
        </section>
      </div>

      <section aria-labelledby="map-heading">
        <h2 id="map-heading" className="font-display text-lg text-ink">
          Where things are
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <MapGroup heading="Run the business" sections={RUN_SECTIONS} />
          <MapGroup heading="Grow" sections={[OUTREACH]} />
          <MapGroup heading="The company" sections={TEAM_SECTIONS} />
        </div>
      </section>
    </div>
  );
}

function Tile({ href, label, value, note, tone }: { href: string; label: string; value: string; note: string; tone: "good" | "bad" | "plain" }) {
  const colour = tone === "bad" ? "text-deep-rose" : tone === "good" ? "text-racing-green" : "text-ink";
  return (
    <Link href={href} className="rounded-xl border border-border bg-white p-4 transition hover:border-blush-border hover:shadow-sm">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl ${colour}`}>{value}</p>
      <p className="mt-1 text-xs text-ink-secondary">{note}</p>
    </Link>
  );
}

function MapGroup({ heading, sections }: { heading: string; sections: OpsSection[] }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">{heading}</p>
      <ul className="mt-3 space-y-3">
        {sections.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="font-medium text-racing-green hover:underline">
              {s.label}
            </Link>
            <p className="text-sm text-ink-secondary">{s.blurb}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
