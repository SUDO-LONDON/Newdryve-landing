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

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Organisations" value={String(organisations.length)} />
          <StatTile label="Linked instructors" value={String(totals.instructors)} />
          <StatTile label="In a lesson" value={String(totals.inLesson)} />
          <StatTile label="Completed revenue" value={formatPence(totals.revenuePence)} />
        </section>

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

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}

function presenceLabel(value: string): string {
  if (value === "in_lesson") return "In lesson";
  if (value === "available") return "Available";
  if (value === "offline") return "Offline";
  return "Unknown";
}
