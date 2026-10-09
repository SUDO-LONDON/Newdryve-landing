"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BillingResponse, Invoice } from "@/lib/organisations/types";
import { addDays, day, gbp, londonToday, mondayOf, shortDate } from "@/lib/organisations/format";

/**
 * Weekly invoices each school raises against its instructors. Raised every
 * Monday automatically; the button here does the same for a finished week
 * that has not been raised yet. Paid is marked by hand when the bank transfer
 * arrives — Newdryve never sees the money.
 */
export default function InvoicesView({ initial, billing }: { initial: Invoice[]; billing: BillingResponse }) {
  const [invoices, setInvoices] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sendNow, setSendNow] = useState(true);
  const lastWeek = addDays(mondayOf(londonToday()), -7);
  const [week, setWeek] = useState(lastWeek);
  const orgs = billing.organisations;
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const billingOn = orgs.filter((o) => o.billing.fee_mode !== "off");
  const today = londonToday();

  const weeks = useMemo(() => {
    const groups = new Map<string, Invoice[]>();
    for (const invoice of invoices) {
      const list = groups.get(invoice.period_start) ?? [];
      list.push(invoice);
      groups.set(invoice.period_start, list);
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [invoices]);

  async function call(path: string, body: unknown, key: string) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      return json;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function generate() {
    const result = await call("/organisations/api/invoices/generate", { week, send: sendNow, organisation_id: orgs.length > 1 ? orgId : undefined }, "generate");
    if (!result) return;
    const items = result.items as Invoice[];
    setInvoices((all) => [...items, ...all.filter((i) => !items.some((n) => n.id === i.id))]);
    setNotice(
      items.length
        ? `${items.length} invoice${items.length === 1 ? "" : "s"} for ${day(week)} – ${day(addDays(week, 6))}${sendNow ? `, ${result.emailed} emailed` : ""}.`
        : "Nothing to invoice for that week: no lessons were taught."
    );
  }

  async function setStatus(invoice: Invoice, status: Invoice["status"]) {
    if (status === "void" && !window.confirm(`Void invoice ${invoice.number}? It will no longer be owed.`)) return;
    const result = await call(`/organisations/api/invoices/${invoice.id}/status`, { status }, `status-${invoice.id}`);
    if (result?.invoice) setInvoices((all) => all.map((i) => (i.id === invoice.id ? (result.invoice as Invoice) : i)));
  }

  async function send(invoice: Invoice) {
    const result = await call(`/organisations/api/invoices/${invoice.id}/send`, {}, `send-${invoice.id}`);
    if (result) {
      setInvoices((all) => all.map((i) => (i.id === invoice.id ? { ...i, emailed_at: new Date().toISOString() } : i)));
      setNotice(`Invoice ${invoice.number} emailed to ${invoice.terms.instructor_name}.`);
    }
  }

  return (
    <div>
      {billingOn.length === 0 ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-bold">Invoices are off.</p>
          <p className="mt-1">
            Set what you charge instructors and your bank details in{" "}
            <Link href="/organisations/settings" className="font-semibold underline">
              Settings
            </Link>
            . Invoices are then raised every Monday for the week before and emailed to each instructor.
          </p>
        </div>
      ) : (
        <section className="rounded-2xl border border-border bg-white p-4 sm:p-5" aria-labelledby="raise-title">
          <h2 id="raise-title" className="text-base font-bold text-ink">
            Raise invoices now
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Invoices go out automatically every Monday morning. Use this for a finished week that has not been invoiced yet.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            {orgs.length > 1 ? (
              <label className="flex flex-col gap-1 text-xs font-bold text-ink-secondary">
                School
                <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="focus-ring min-h-11 rounded-lg border border-border bg-white px-3 text-sm font-normal text-ink">
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="flex flex-col gap-1 text-xs font-bold text-ink-secondary">
              Week
              <select value={week} onChange={(e) => setWeek(e.target.value)} className="focus-ring min-h-11 rounded-lg border border-border bg-white px-3 text-sm font-normal text-ink">
                {Array.from({ length: 8 }, (_, i) => addDays(lastWeek, -7 * i)).map((w) => (
                  <option key={w} value={w}>
                    {day(w)} – {day(addDays(w, 6))}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} className="size-4 accent-racing-green" />
              Email them to instructors
            </label>
            <button
              type="button"
              onClick={() => void generate()}
              disabled={busy === "generate"}
              className="focus-ring inline-flex min-h-11 items-center rounded-full bg-racing-green px-5 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy === "generate" ? "Raising…" : "Raise invoices"}
            </button>
          </div>
        </section>
      )}

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {notice}
        </p>
      ) : null}

      {weeks.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-white p-8 text-center text-sm text-ink-secondary">No invoices in the last 12 weeks.</p>
      ) : (
        weeks.map(([weekStart, items]) => {
          const owed = items.filter((i) => i.status === "issued").reduce((n, i) => n + i.amount_pence, 0);
          const total = items.filter((i) => i.status !== "void").reduce((n, i) => n + i.amount_pence, 0);
          return (
            <section key={weekStart} className="mt-6" aria-label={`Week of ${day(weekStart)}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-bold text-ink">
                  {day(weekStart)} – {day(addDays(weekStart, 6))}
                </h2>
                <p className="text-sm text-ink-secondary">
                  {gbp(total)} invoiced{owed ? ` · ${gbp(owed)} unpaid` : " · all paid"}
                </p>
              </div>
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
                {items.map((invoice) => {
                  const overdue = invoice.status === "issued" && invoice.due_on < today;
                  const pill =
                    invoice.status === "paid"
                      ? ["Paid", "bg-emerald-100 text-emerald-900"]
                      : invoice.status === "void"
                        ? ["Void", "bg-canvas text-ink-secondary"]
                        : overdue
                          ? ["Overdue", "bg-rose-100 text-rose-900"]
                          : ["Unpaid", "bg-amber-100 text-amber-900"];
                  return (
                    <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">
                          {invoice.terms.instructor_name} <span className="font-bold">{gbp(invoice.amount_pence)}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-ink-secondary">
                          {invoice.number} · due {shortDate(invoice.due_on)} ·{" "}
                          {invoice.emailed_at ? `emailed ${shortDate(invoice.emailed_at)}` : "not emailed yet"}
                          {invoice.paid_at && invoice.status === "paid" ? ` · paid ${shortDate(invoice.paid_at)}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${pill[1]}`}>{pill[0]}</span>
                        <Link href={`/organisations/invoices/${invoice.id}`} className="focus-ring inline-flex min-h-11 items-center rounded-full border border-border px-3 text-sm font-semibold text-ink">
                          View
                        </Link>
                        {invoice.status === "issued" ? (
                          <button type="button" onClick={() => void setStatus(invoice, "paid")} disabled={busy !== null} className="focus-ring inline-flex min-h-11 items-center rounded-full bg-racing-green px-3 text-sm font-bold text-white disabled:opacity-60">
                            Mark paid
                          </button>
                        ) : invoice.status === "paid" ? (
                          <button type="button" onClick={() => void setStatus(invoice, "issued")} disabled={busy !== null} className="focus-ring inline-flex min-h-11 items-center rounded-full border border-border px-3 text-sm font-semibold text-ink disabled:opacity-60">
                            Mark unpaid
                          </button>
                        ) : null}
                        {invoice.status !== "void" ? (
                          <button type="button" onClick={() => void send(invoice)} disabled={busy !== null} className="focus-ring inline-flex min-h-11 items-center rounded-full border border-border px-3 text-sm font-semibold text-ink disabled:opacity-60">
                            {busy === `send-${invoice.id}` ? "Sending…" : invoice.emailed_at ? "Resend" : "Send"}
                          </button>
                        ) : null}
                        {invoice.status === "issued" ? (
                          <button type="button" onClick={() => void setStatus(invoice, "void")} disabled={busy !== null} className="focus-ring inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-rose-800 disabled:opacity-60">
                            Void
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
