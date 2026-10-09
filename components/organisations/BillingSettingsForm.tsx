"use client";

import { useState } from "react";
import type { BillingResponse, BillingSettings, FeeMode } from "@/lib/organisations/types";
import { gbp, sortCode as formatSortCode } from "@/lib/organisations/format";

const MODES: Array<{ value: FeeMode; label: string; hint: string }> = [
  { value: "per_hour", label: "Per hour taught", hint: "A set amount for every hour of completed lessons." },
  { value: "per_lesson", label: "Per lesson", hint: "A set amount for every completed lesson." },
  { value: "percent_of_revenue", label: "Share of takings", hint: "A percentage of what the instructor's lessons earned." },
  { value: "flat_weekly", label: "Flat weekly fee", hint: "The same amount every week, whatever was taught." },
  { value: "off", label: "Don't invoice", hint: "No invoices are raised." },
];

const input =
  "focus-ring w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base text-ink sm:text-sm";
const label = "text-xs font-bold uppercase tracking-[0.5px] text-ink-secondary";

/** What a school charges its instructors, and where they pay it. */
export default function BillingSettingsForm({ data }: { data: BillingResponse }) {
  return (
    <div className="space-y-6">
      {data.organisations.map((org) => (
        <OrganisationBilling key={org.id} org={org} showName={data.organisations.length > 1} />
      ))}
    </div>
  );
}

function OrganisationBilling({ org, showName }: { org: BillingResponse["organisations"][number]; showName: boolean }) {
  const b = org.billing;
  const [mode, setMode] = useState<FeeMode>(b.fee_mode);
  const [amount, setAmount] = useState(b.amount_pence != null ? (b.amount_pence / 100).toFixed(2) : "");
  const [percent, setPercent] = useState(b.percent_bps != null ? String(b.percent_bps / 100) : "");
  const [terms, setTerms] = useState(String(b.payment_terms_days));
  const [accountName, setAccountName] = useState(b.bank_account_name ?? "");
  const [sortCode, setSortCode] = useState(formatSortCode(b.bank_sort_code));
  const [accountNumber, setAccountNumber] = useState(b.bank_account_number ?? "");
  const [fromName, setFromName] = useState(b.invoice_from_name ?? org.legal_name ?? org.name);
  const [fromAddress, setFromAddress] = useState(b.invoice_from_address ?? "");
  const [notes, setNotes] = useState(b.invoice_notes ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const amountPence = Math.round(Number(amount) * 100);
  const percentBps = Math.round(Number(percent) * 100);
  const example =
    mode === "per_hour" && amountPence > 0
      ? `10 hours taught in a week → ${gbp(amountPence * 10)}`
      : mode === "per_lesson" && amountPence > 0
        ? `8 lessons in a week → ${gbp(amountPence * 8)}`
        : mode === "percent_of_revenue" && percentBps > 0
          ? `£400 of lesson takings → ${gbp(Math.round((40000 * percentBps) / 10000))}`
          : mode === "flat_weekly" && amountPence > 0
            ? `${gbp(amountPence)} every week`
            : null;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const body: Partial<BillingSettings> & { organisation_id: string } = {
      organisation_id: org.id,
      fee_mode: mode,
      amount_pence: mode === "per_hour" || mode === "per_lesson" || mode === "flat_weekly" ? amountPence : null,
      percent_bps: mode === "percent_of_revenue" ? percentBps : null,
      payment_terms_days: Number(terms) || 7,
      bank_account_name: accountName.trim() || null,
      bank_sort_code: sortCode.trim() || null,
      bank_account_number: accountNumber.trim() || null,
      invoice_from_name: fromName.trim() || null,
      invoice_from_address: fromAddress.trim() || null,
      invoice_notes: notes.trim() || null,
    };
    try {
      const res = await fetch("/organisations/api/billing", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save.");
      setMessage({ ok: true, text: mode === "off" ? "Saved. No invoices will be raised." : "Saved. Invoices will use these terms from next Monday." });
    } catch (cause) {
      setMessage({ ok: false, text: cause instanceof Error ? cause.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="rounded-2xl border border-border bg-white p-4 sm:p-6">
      {showName ? <h2 className="mb-4 font-display text-2xl text-ink">{org.name}</h2> : null}

      <fieldset>
        <legend className="text-base font-bold text-ink">What instructors pay you</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {MODES.map((m) => (
            <label
              key={m.value}
              className={`flex min-h-11 cursor-pointer gap-3 rounded-xl border p-3 ${mode === m.value ? "border-racing-green bg-emerald-50" : "border-border"}`}
            >
              <input type="radio" name={`mode-${org.id}`} value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} className="mt-1 size-4 accent-racing-green" />
              <span>
                <span className="block text-sm font-bold text-ink">{m.label}</span>
                <span className="block text-xs text-ink-secondary">{m.hint}</span>
              </span>
            </label>
          ))}
        </div>

        {mode !== "off" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {mode === "percent_of_revenue" ? (
              <label className="flex flex-col gap-1.5">
                <span className={label}>Percentage</span>
                <span className="relative">
                  <input inputMode="decimal" required value={percent} onChange={(e) => setPercent(e.target.value)} className={`${input} pr-8`} placeholder="10" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-secondary">%</span>
                </span>
              </label>
            ) : (
              <label className="flex flex-col gap-1.5">
                <span className={label}>{mode === "per_hour" ? "Amount per hour" : mode === "per_lesson" ? "Amount per lesson" : "Weekly fee"}</span>
                <span className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary">£</span>
                  <input inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} className={`${input} pl-7`} placeholder="5.00" />
                </span>
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className={label}>Pay within</span>
              <select value={terms} onChange={(e) => setTerms(e.target.value)} className={input}>
                {[3, 7, 14, 30].map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
            </label>
            {example ? <p className="self-end pb-2.5 text-sm text-ink-secondary">For example: {example}</p> : null}
          </div>
        ) : null}
      </fieldset>

      <div className="mt-6 border-t border-border pt-5">
      <fieldset>
        <legend className="text-base font-bold text-ink">Your bank details</legend>
        <p className="mt-1 text-sm text-ink-secondary">Printed on every invoice so instructors can pay you by bank transfer.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className={label}>Account name</span>
            <input value={accountName} onChange={(e) => setAccountName(e.target.value)} className={input} autoComplete="off" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Sort code</span>
            <input value={sortCode} onChange={(e) => setSortCode(e.target.value)} inputMode="numeric" placeholder="12-34-56" className={input} autoComplete="off" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Account number</span>
            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} inputMode="numeric" placeholder="12345678" className={input} autoComplete="off" />
          </label>
        </div>
      </fieldset>
      </div>

      <div className="mt-6 border-t border-border pt-5">
      <fieldset>
        <legend className="text-base font-bold text-ink">On the invoice</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={label}>Invoice from</span>
            <input value={fromName} onChange={(e) => setFromName(e.target.value)} className={input} />
          </label>
          <label className="flex flex-col gap-1.5 sm:row-span-2">
            <span className={label}>Address (optional)</span>
            <textarea value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} rows={4} className={`${input} resize-none`} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Note on every invoice (optional)</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Thank you for teaching with us." className={input} />
          </label>
        </div>
      </fieldset>
      </div>

      {message ? (
        <p role={message.ok ? "status" : "alert"} className={`mt-5 rounded-xl px-4 py-3 text-sm ${message.ok ? "bg-emerald-50 font-semibold text-emerald-900" : "bg-rose-50 text-rose-800"}`}>
          {message.text}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white disabled:opacity-60 sm:w-auto">
        {busy ? "Saving…" : "Save billing settings"}
      </button>
    </form>
  );
}
