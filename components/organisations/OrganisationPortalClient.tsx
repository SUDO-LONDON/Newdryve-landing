import Link from "next/link";
import { formatPence, organisationTotals, type OpsOrganisationWithMembers } from "@/lib/ops/types";

export default function OrganisationPortalClient({
  organisations,
  email,
}: {
  organisations: OpsOrganisationWithMembers[];
  email: string | null;
}) {
  const allMembers = organisations.flatMap((organisation) => organisation.members);
  const totals = organisationTotals(allMembers);

  // An admin can be mapped to more than one school, so everything here sums
  // across them rather than assuming a single organisation.
  const window = organisations[0]?.activity?.window_days ?? 30;
  const rollup = organisations.reduce(
    (acc, org) => {
      const a = org.activity;
      if (a) {
        acc.completed += a.completed;
        acc.cancelled += a.cancelled;
        acc.no_show += a.no_show;
        acc.upcoming += a.upcoming;
        acc.revenue_pence += a.revenue_pence;
        acc.finished += a.completed + a.cancelled + a.no_show;
        a.series.forEach((day, i) => {
          acc.series[i] = acc.series[i]
            ? {
                date: day.date,
                lessons: acc.series[i].lessons + day.lessons,
                revenue_pence: acc.series[i].revenue_pence + day.revenue_pence,
              }
            : { ...day };
        });
      }
      acc.payouts_total_pence += org.payouts_total_pence ?? 0;
      return acc;
    },
    {
      completed: 0, cancelled: 0, no_show: 0, upcoming: 0, revenue_pence: 0,
      finished: 0, payouts_total_pence: 0,
      series: [] as Array<{ date: string; lessons: number; revenue_pence: number }>,
      completion_rate: null as number | null,
    }
  );
  rollup.completion_rate = rollup.finished > 0 ? Math.round((rollup.completed / rollup.finished) * 100) : null;

  const peak = rollup.series.reduce((n, day) => Math.max(n, day.lessons), 0);
  const liveLessons = organisations.flatMap((org) => org.live_lessons ?? []);
  const upcoming = organisations
    .flatMap((org) => org.upcoming_today ?? [])
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  const payouts = organisations
    .flatMap((org) => org.payouts ?? [])
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const learners = organisations
    .flatMap((org) => org.learner_progress ?? [])
    .sort((a, b) => b.readiness_percent - a.readiness_percent);
  const testReady = learners.filter((l) => l.readiness_percent >= 85).length;

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-border bg-white/80 px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-racing-green">
              Newdryve
            </p>
            <h1 className="font-display text-xl text-ink">Organisation portal</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden max-w-[16rem] truncate text-xs text-ink-muted sm:block" title={email ?? undefined}>
              {email}
            </p>
            <form action="/organisations/auth/signout" method="post">
              <button className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink hover:bg-blush-surface">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-racing-green">
            Overview
          </p>
          <h2 className="mt-1 font-display text-3xl text-ink">
            {organisations.length === 1 ? organisations[0]?.name : "Your organisations"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
            Track linked instructors, live lesson status and completed lesson revenue for your organisation.
          </p>
        </section>

        {/* Now first, then the last month, then the people.
            A school opening this wants to know what is happening at this
            moment before it wants a total — a revenue figure answers a
            question nobody is asking at nine in the morning. */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="In a lesson now" value={String(totals.inLesson)} accent={totals.inLesson > 0} />
          <StatTile label="Linked instructors" value={String(totals.instructors)} />
          <StatTile
            label={`Completed · ${window}d`}
            value={String(rollup.completed)}
            sub={rollup.completion_rate == null ? undefined : `${rollup.completion_rate}% of finished lessons`}
          />
          <StatTile
            label={`Lesson revenue · ${window}d`}
            value={formatPence(rollup.revenue_pence)}
            sub={rollup.payouts_total_pence ? `${formatPence(rollup.payouts_total_pence)} paid out` : undefined}
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Booked ahead" value={String(rollup.upcoming)} />
          <StatTile label={`Cancelled · ${window}d`} value={String(rollup.cancelled)} />
          <StatTile label={`No-shows · ${window}d`} value={String(rollup.no_show)} />
          <StatTile label="Lifetime revenue" value={formatPence(totals.revenuePence)} />
        </section>

        {/* Thirty days, one bar a day. The shape is the point — one month
            total hides a bad fortnight followed by a good one. */}
        {rollup.series.length ? (
          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-lg text-ink">Lessons a day</h3>
              <p className="text-xs text-ink-muted">Last {window} days · busiest {peak} in a day</p>
            </div>
            <div className="mt-4 flex h-24 items-end gap-[3px]" role="img" aria-label={`Completed lessons a day over the last ${window} days, busiest ${peak}`}>
              {rollup.series.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.lessons} lesson${day.lessons === 1 ? "" : "s"}, ${formatPence(day.revenue_pence)}`}
                  className="flex-1 rounded-t bg-racing-green/80"
                  // A day with nothing still gets a hairline, or the axis
                  // vanishes and a quiet week reads as missing data.
                  style={{ height: `${peak ? Math.max(2, Math.round((day.lessons / peak) * 100)) : 2}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
              <span>{rollup.series[0]?.date}</span>
              <span>{rollup.series[rollup.series.length - 1]?.date}</span>
            </div>
          </section>
        ) : null}

        {liveLessons.length ? (
          <section className="rounded-2xl border border-racing-green/40 bg-white p-5">
            <h3 className="font-display text-lg text-ink">On the road now</h3>
            <ul className="mt-3 divide-y divide-border">
              {liveLessons.map((lesson) => (
                <li key={lesson.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {lesson.instructor_name} <span className="text-ink-muted">with</span> {lesson.learner_name}
                    </p>
                    {lesson.pickup_address ? (
                      <p className="text-xs text-ink-muted">{lesson.pickup_address}</p>
                    ) : null}
                  </div>
                  <p className="text-xs text-ink-secondary">
                    {timeOnly(lesson.starts_at)}–{timeOnly(lesson.ends_at)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {upcoming.length ? (
          <section className="rounded-2xl border border-border bg-white p-5">
            <h3 className="font-display text-lg text-ink">Next 24 hours</h3>
            <ul className="mt-3 divide-y divide-border">
              {upcoming.slice(0, 8).map((lesson) => (
                <li key={lesson.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                  <p className="text-sm text-ink">
                    {lesson.instructor_name} <span className="text-ink-muted">with</span> {lesson.learner_name}
                  </p>
                  <p className="text-xs text-ink-secondary">
                    {timeOnly(lesson.starts_at)}
                    {lesson.status === "pending" ? " · awaiting confirmation" : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {payouts.length ? (
          <section className="rounded-2xl border border-border bg-white p-5">
            <h3 className="font-display text-lg text-ink">Payouts</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              Paid by Stripe straight to each instructor&rsquo;s own account.
            </p>
            <ul className="mt-3 divide-y divide-border">
              {payouts.slice(0, 8).map((payout, index) => (
                <li key={`${payout.created_at}-${index}`} className="flex items-baseline justify-between gap-3 py-2.5">
                  <span className="text-sm text-ink">{formatPence(payout.amount_pence)}</span>
                  <span className="text-xs text-ink-secondary">
                    {payout.status === "paid" ? "Paid" : payout.status}
                    {payout.arrival_date ? ` · ${dateOnly(payout.arrival_date)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Learner progress rather than lesson notes.
            Notes are free text an instructor wrote about a named person, and a
            school does not need to read them to run itself. Readiness answers
            the same question — who is close, who is stuck — without handing
            over someone's written character assessment. */}
        {learners.length ? (
          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="font-display text-lg text-ink">Learner progress</h3>
              <p className="text-xs text-ink-muted">
                {learners.length} learner{learners.length === 1 ? "" : "s"}
                {testReady ? ` · ${testReady} near test standard` : ""}
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {learners.slice(0, 20).map((learner) => (
                <li key={learner.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm text-ink">{learner.name}</p>
                    <p className="text-xs text-ink-muted">
                      {learner.skills_competent}/{learner.skills_total} skills
                      <span aria-hidden> · </span>
                      {learner.lessons_completed} lesson{learner.lessons_completed === 1 ? "" : "s"}
                      {learner.last_lesson_at ? ` · last ${dateOnly(learner.last_lesson_at)}` : ""}
                    </p>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas"
                    role="img"
                    aria-label={`${learner.name}, ${learner.readiness_percent}% test ready`}
                  >
                    {/* Green only near test standard. A full-looking bar on a
                        learner at 30% would tell a school the opposite of the
                        truth at a glance. */}
                    <div
                      className={`h-full rounded-full ${
                        learner.readiness_percent >= 85 ? "bg-racing-green" : "bg-racing-green/45"
                      }`}
                      style={{ width: `${Math.max(2, learner.readiness_percent)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {organisations.map((organisation) => {
          const summary = organisationTotals(organisation.members);
          return (
            <section key={organisation.id} className="rounded-2xl border border-border bg-white p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-display text-2xl text-ink">{organisation.name}</h3>
                  <p className="mt-1 text-sm text-ink-secondary">
                    {summary.instructors} linked instructor{summary.instructors === 1 ? "" : "s"} · {summary.inLesson} in lesson
                  </p>
                </div>
                <span className="w-fit rounded-full bg-blush-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  {organisation.status}
                </span>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-border bg-blush-surface/60 text-[11px] uppercase tracking-wider text-ink-muted">
                    <tr>
                      <th className="px-3 py-3">Instructor</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Current lesson</th>
                      <th className="px-3 py-3 text-right">Lessons</th>
                      <th className="px-3 py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {organisation.members.map((member) => (
                      <tr key={member.id}>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-ink">{member.display_name}</p>
                          <p className="text-xs text-ink-muted">{member.email || member.instructor_id}</p>
                        </td>
                        <td className="px-3 py-3 text-ink-secondary">{member.status}</td>
                        <td className="px-3 py-3 text-ink-secondary">
                          {presenceLabel(member.lesson_presence)}
                          {member.active_lesson_label ? ` · ${member.active_lesson_label}` : ""}
                        </td>
                        <td className="px-3 py-3 text-right text-ink">{member.lesson_count}</td>
                        <td className="px-3 py-3 text-right font-medium text-ink">
                          {formatPence(member.revenue_pence)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {organisation.members.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ink-muted">
                    No instructors have linked to this organisation yet.
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}

        {organisations.length === 0 ? (
          <section className="rounded-2xl border border-border bg-white p-8 text-center">
            <h2 className="font-display text-xl text-ink">No organisation access yet</h2>
            <p className="mt-2 text-sm text-ink-secondary">
              This account is signed in, but Newdryve has not linked it to an organisation.
            </p>
            <Link href="/organisations/login" className="mt-4 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-semibold text-ink">
              Back to sign in
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-white p-4 ${accent ? "border-racing-green" : "border-border"}`}>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl ${accent ? "text-racing-green" : "text-ink"}`}>{value}</p>
      {sub ? <p className="mt-1 text-[11px] text-ink-muted">{sub}</p> : null}
    </div>
  );
}

function timeOnly(iso: string): string {
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "";
}

function dateOnly(iso: string): string {
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "";
}

function presenceLabel(value: string): string {
  if (value === "in_lesson") return "In lesson";
  if (value === "available") return "Available";
  if (value === "offline") return "Offline";
  return "Unknown";
}
