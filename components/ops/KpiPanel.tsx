"use client";

import { useMemo, useState } from "react";
import type { Founder, OpsKpi } from "@/lib/ops/types";
import { mondayOf } from "@/lib/ops/types";

function weekLabel(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `Week of ${fmt(start)} – ${fmt(end)}`;
}

// Weekly KPIs. The CEO sees an add form and delete controls; every founder can
// tick off KPIs assigned to them. State is optimistic-updated after each call.
export default function KpiPanel({
  initialKpis,
  founders,
  isCeo,
  currentEmail,
}: {
  initialKpis: OpsKpi[];
  founders: Founder[];
  isCeo: boolean;
  currentEmail: string;
}) {
  const [kpis, setKpis] = useState<OpsKpi[]>(initialKpis);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const thisWeek = mondayOf();
  const [weekStart, setWeekStart] = useState(thisWeek);
  const [assignee, setAssignee] = useState(founders[0]?.email ?? "");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [adding, setAdding] = useState(false);

  const nameFor = useMemo(() => {
    const map = new Map(founders.map((f) => [f.email.toLowerCase(), f.name || f.email]));
    return (email: string) => map.get(email.toLowerCase()) ?? email;
  }, [founders]);

  // Group by week (desc), then by assignee.
  const grouped = useMemo(() => {
    const byWeek = new Map<string, OpsKpi[]>();
    for (const k of kpis) {
      const list = byWeek.get(k.week_start) ?? [];
      list.push(k);
      byWeek.set(k.week_start, list);
    }
    return [...byWeek.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [kpis]);

  async function addKpi() {
    if (!title.trim()) return setError("Enter a KPI");
    if (!assignee) return setError("Choose who it's for");
    setAdding(true);
    setError(null);
    const res = await fetch("/ops/api/kpis", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        week_start: weekStart,
        assignee_email: assignee,
        title: title.trim(),
        detail: detail.trim() || undefined,
      }),
    });
    const d = await res.json();
    setAdding(false);
    if (d.kpi) {
      setKpis((prev) => [d.kpi as OpsKpi, ...prev]);
      setTitle("");
      setDetail("");
    } else {
      setError(d.error ?? "Failed to add KPI");
    }
  }

  async function toggle(k: OpsKpi) {
    setBusyId(k.id);
    const res = await fetch(`/ops/api/kpis/${k.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: !k.done }),
    });
    const d = await res.json();
    setBusyId(null);
    if (d.kpi) setKpis((prev) => prev.map((x) => (x.id === k.id ? (d.kpi as OpsKpi) : x)));
    else setError(d.error ?? "Failed to update");
  }

  async function remove(k: OpsKpi) {
    if (!confirm("Delete this KPI?")) return;
    setBusyId(k.id);
    const res = await fetch(`/ops/api/kpis/${k.id}`, { method: "DELETE" });
    const d = await res.json();
    setBusyId(null);
    if (d.ok) setKpis((prev) => prev.filter((x) => x.id !== k.id));
    else setError(d.error ?? "Failed to delete");
  }

  return (
    <section id="kpis" className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-ink">Weekly KPIs</h2>
        <span className="text-xs text-ink-muted">
          {isCeo ? "You assign; each person ticks their own" : "Tick off the KPIs assigned to you"}
        </span>
      </div>

      {isCeo && (
        <div className="mt-4 rounded-xl border border-blush-border bg-blush-surface p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Add a KPI
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-xs text-ink-secondary">
              Week starting
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value || thisWeek)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="text-xs text-ink-secondary">
              For
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
              >
                {founders.map((f) => (
                  <option key={f.email} value={f.email}>
                    {f.name || f.email}
                    {f.role ? ` · ${f.role}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="KPI, e.g. Sign 5 new instructors"
            className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
          />
          <input
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Extra detail (optional)"
            className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={addKpi}
              disabled={adding}
              className="rounded-lg gradient-bg px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {adding ? "Adding…" : "Add KPI"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-deep-rose">{error}</p>}

      <div className="mt-4 space-y-5">
        {grouped.length === 0 && <p className="text-sm text-ink-muted">No KPIs yet.</p>}
        {grouped.map(([week, items]) => (
          <div key={week}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {weekLabel(week)}
            </p>
            <ul className="space-y-2">
              {items.map((k) => {
                const canToggle = isCeo || k.assignee_email.toLowerCase() === currentEmail.toLowerCase();
                return (
                  <li
                    key={k.id}
                    className="flex items-start gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={k.done}
                      disabled={!canToggle || busyId === k.id}
                      onChange={() => toggle(k)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-border disabled:opacity-50"
                      aria-label={`Mark "${k.title}" done`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${k.done ? "text-ink-muted line-through" : "text-ink"}`}>
                        {k.title}
                      </span>
                      {k.detail && <span className="block text-xs text-ink-muted">{k.detail}</span>}
                      <span className="text-xs text-ink-muted">{nameFor(k.assignee_email)}</span>
                    </span>
                    {isCeo && (
                      <button
                        onClick={() => remove(k)}
                        disabled={busyId === k.id}
                        className="shrink-0 text-xs text-ink-muted hover:text-deep-rose disabled:opacity-60"
                      >
                        Delete
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
