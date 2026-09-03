"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  formatPence,
  organisationTotals,
  type OpsOrganisationWithMembers,
} from "@/lib/ops/types";

export default function OrganisationDetailClient({
  organisation,
}: {
  organisation: OpsOrganisationWithMembers;
}) {
  const router = useRouter();
  const totals = organisationTotals(organisation.members);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [freshCode, setFreshCode] = useState<string | null>(null);

  async function regenerateCode() {
    setBusy("code");
    setError(null);
    try {
      const response = await fetch(`/organisations/api/${organisation.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "regenerate_code" }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        organisation?: OpsOrganisationWithMembers;
      };
      if (!response.ok) throw new Error(body.error || "Could not regenerate code.");
      setFreshCode(body.organisation?.join_code ?? null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not regenerate code.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/organisations" className="text-sm text-racing-green hover:underline">
          &lt;- Organisations
        </Link>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-racing-green">
              Organisation
            </p>
            <h1 className="mt-1 font-display text-2xl text-ink">{organisation.name}</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              {organisation.legal_name || "No legal name"} · {organisation.contact_email || "No contact email"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-[11px] uppercase tracking-wider text-ink-muted">Join code</p>
            <p className="mt-1 font-mono text-3xl tracking-[0.18em] text-ink">
              {freshCode || organisation.join_code}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Instructors enter this in app settings to join the organisation.
            </p>
            <button
              type="button"
              onClick={regenerateCode}
              disabled={busy === "code"}
              className="mt-2 text-sm font-semibold text-racing-green disabled:opacity-60"
            >
              {busy === "code" ? "Regenerating..." : "Regenerate code"}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-blush-border bg-blush-surface p-4 text-sm text-deep-rose">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Linked instructors" value={String(totals.instructors)} />
        <StatTile label="In a lesson" value={String(totals.inLesson)} />
        <StatTile label="Lessons" value={String(totals.lessonCount)} />
        <StatTile label="Revenue" value={formatPence(totals.revenuePence)} />
      </div>

      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="font-display text-lg text-ink">Instructors</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-border bg-blush-surface/60 text-[11px] uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-3 py-3">Instructor</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Current lesson</th>
                <th className="px-3 py-3 text-right">Lessons</th>
                <th className="px-3 py-3 text-right">Revenue</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {organisation.members.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-ink">{row.display_name}</p>
                    <p className="text-xs text-ink-muted">{row.email || row.instructor_id}</p>
                  </td>
                  <td className="px-3 py-3 text-ink-secondary">{row.status}</td>
                  <td className="px-3 py-3 text-ink-secondary">
                    {presenceLabel(row.lesson_presence)}
                    {row.active_lesson_label ? ` · ${row.active_lesson_label}` : ""}
                  </td>
                  <td className="px-3 py-3 text-right text-ink">{row.lesson_count}</td>
                  <td className="px-3 py-3 text-right font-medium text-ink">
                    {formatPence(row.revenue_pence)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/organisations/${organisation.id}/instructors/${row.id}`}
                      className="text-sm font-semibold text-racing-green hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {organisation.members.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              No instructors linked yet. They will appear here after entering the code in the app.
            </p>
          ) : null}
        </div>
      </section>
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

function presenceLabel(value: string): string {
  if (value === "in_lesson") return "In lesson";
  if (value === "available") return "Available";
  if (value === "offline") return "Offline";
  return "Unknown";
}
