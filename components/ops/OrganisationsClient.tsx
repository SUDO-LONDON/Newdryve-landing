"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  formatPence,
  organisationTotals,
  type OpsOrganisationWithMembers,
} from "@/lib/ops/types";

export default function OrganisationsClient({
  organisations,
}: {
  organisations: OpsOrganisationWithMembers[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    legal_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
  });

  const totals = useMemo(() => {
    const allMembers = organisations.flatMap((org) => org.members);
    return {
      organisations: organisations.length,
      ...organisationTotals(allMembers),
    };
  }, [organisations]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCreatedCode(null);
    try {
      const response = await fetch("/ops/api/organisations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        organisation?: OpsOrganisationWithMembers;
      };
      if (!response.ok) throw new Error(body.error || "Could not create organisation.");
      setCreatedCode(body.organisation?.join_code ?? null);
      setOpen(false);
      setForm({ name: "", legal_name: "", contact_name: "", contact_email: "", contact_phone: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create organisation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-racing-green">
            Supply
          </p>
          <h1 className="mt-1 font-display text-2xl text-ink">Organisations</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-secondary">
            Create a company account, give them an eight digit join code, then track the
            instructors who connect from the app.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg bg-racing-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-racing-green-dark"
        >
          {open ? "Close" : "Create organisation"}
        </button>
      </header>

      {createdCode ? (
        <div className="rounded-xl border border-racing-green/20 bg-racing-green/10 p-4">
          <p className="text-sm font-semibold text-racing-green">Organisation code created</p>
          <p className="mt-1 font-mono text-3xl tracking-[0.18em] text-ink">{createdCode}</p>
          <p className="mt-1 text-sm text-ink-secondary">
            Give this code to the organisation. Instructors enter it from Settings in the app.
          </p>
        </div>
      ) : null}

      {open ? (
        <form onSubmit={create} className="rounded-2xl border border-border bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-ink">
              Organisation name
              <input
                required
                value={form.name}
                onChange={(event) => setForm((cur) => ({ ...cur, name: event.target.value }))}
                placeholder="Norwich Driving School"
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm font-medium text-ink">
              Legal name
              <input
                value={form.legal_name}
                onChange={(event) => setForm((cur) => ({ ...cur, legal_name: event.target.value }))}
                placeholder="Optional"
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm font-medium text-ink">
              Contact name
              <input
                value={form.contact_name}
                onChange={(event) => setForm((cur) => ({ ...cur, contact_name: event.target.value }))}
                placeholder="Who runs the account"
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm font-medium text-ink">
              Contact email
              <input
                type="email"
                value={form.contact_email}
                onChange={(event) => setForm((cur) => ({ ...cur, contact_email: event.target.value }))}
                placeholder="owner@example.com"
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium text-ink">
            Contact phone
            <input
              value={form.contact_phone}
              onChange={(event) => setForm((cur) => ({ ...cur, contact_phone: event.target.value }))}
              placeholder="Optional"
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          {error ? <p className="mt-3 text-sm text-deep-rose">{error}</p> : null}
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-racing-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create and generate code"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-ink hover:bg-blush-surface"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Organisations" value={String(totals.organisations)} />
        <StatTile label="Linked instructors" value={String(totals.instructors)} />
        <StatTile label="In a lesson" value={String(totals.inLesson)} />
        <StatTile label="Total revenue" value={formatPence(totals.revenuePence)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {organisations.map((organisation) => {
          const summary = organisationTotals(organisation.members);
          return (
            <article key={organisation.id} className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-xl text-ink">{organisation.name}</h2>
                  <p className="mt-1 text-sm text-ink-secondary">
                    {organisation.contact_email || "No contact email"} · {organisation.status}
                  </p>
                </div>
                <span className="rounded-full bg-blush-surface px-3 py-1 font-mono text-sm tracking-[0.12em] text-ink">
                  {organisation.join_code}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <MiniStat label="People" value={String(summary.instructors)} />
                <MiniStat label="Live now" value={String(summary.inLesson)} />
                <MiniStat label="Lessons" value={String(summary.lessonCount)} />
                <MiniStat label="Revenue" value={formatPence(summary.revenuePence)} />
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                {organisation.members.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-blush-surface/60 text-[11px] uppercase tracking-wider text-ink-muted">
                      <tr>
                        <th className="px-3 py-2">Instructor</th>
                        <th className="px-3 py-2">Lesson</th>
                        <th className="px-3 py-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {organisation.members.slice(0, 4).map((member) => (
                        <tr key={member.id}>
                          <td className="px-3 py-3">
                            <Link
                              href={`/ops/organisations/${organisation.id}/instructors/${member.id}`}
                              className="font-semibold text-ink hover:text-racing-green"
                            >
                              {member.display_name}
                            </Link>
                            <p className="text-xs text-ink-muted">{member.email || member.instructor_id}</p>
                          </td>
                          <td className="px-3 py-3 text-ink-secondary">
                            {presenceLabel(member.lesson_presence)}
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-ink">
                            {formatPence(member.revenue_pence)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-4 py-5 text-sm text-ink-secondary">
                    No instructors linked yet. Give the code to the organisation and they will
                    appear here after joining from the app.
                  </p>
                )}
              </div>

              <Link
                href={`/ops/organisations/${organisation.id}`}
                className="mt-4 inline-flex rounded-lg border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-blush-surface"
              >
                View organisation
              </Link>
            </article>
          );
        })}
      </div>

      {organisations.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <p className="font-display text-xl text-ink">No organisations yet</p>
          <p className="mt-1 text-sm text-ink-secondary">
            Create the first company account to generate its join code.
          </p>
        </div>
      ) : null}
    </div>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

function presenceLabel(value: string): string {
  if (value === "in_lesson") return "In lesson";
  if (value === "available") return "Available";
  if (value === "offline") return "Offline";
  return "Unknown";
}
