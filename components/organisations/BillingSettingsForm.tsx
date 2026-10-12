"use client";

import { useState } from "react";
import type { BillingResponse } from "@/lib/organisations/types";
import { describeFeeTerms, feeModeLabel, isLegacyFeeMode } from "@/lib/organisations/fees";
import { longDate, sortCode as formatSortCode } from "@/lib/organisations/format";
import { apiError, readJson } from "@/lib/organisations/http";

const input =
  "focus-ring w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base text-ink sm:text-sm";
const label = "text-xs font-bold uppercase tracking-[0.5px] text-ink-secondary";

/**
 * What a school charges its instructors, and where they pay it.
 *
 * The fee terms are set by Newdryve when it onboards the school, so they are
 * shown here read-only; the school edits only its own bank and invoice
 * details. The save sends only those fields — the API refuses a change to the
 * terms with 403 fee_terms_managed_by_newdryve.
 */
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
  const [terms, setTerms] = useState(String(b.payment_terms_days));
  const [accountName, setAccountName] = useState(b.bank_account_name ?? "");
  const [sortCode, setSortCode] = useState(formatSortCode(b.bank_sort_code));
  const [accountNumber, setAccountNumber] = useState(b.bank_account_number ?? "");
  const [fromName, setFromName] = useState(b.invoice_from_name ?? org.legal_name ?? org.name);
  const [fromAddress, setFromAddress] = useState(b.invoice_from_address ?? "");
  const [notes, setNotes] = useState(b.invoice_notes ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const invoicesOff = b.fee_mode === "off";

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    // The school's own fields only. Fee terms are Newdryve's and never sent.
    const body = {
      organisation_id: org.id,
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
      const json = await readJson(res);
      if (!res.ok) {
        const error = apiError(json, res.status, "Could not save.");
        throw new Error(
          error.code === "fee_terms_managed_by_newdryve"
            ? "Your fee terms are set by Newdryve and can't be changed here. Contact us to change them."
            : error.message
        );
      }
      setMessage({
        ok: true,
        text: invoicesOff
          ? "Saved. Invoices start once Newdryve sets your fee terms."
          : "Saved. Invoices will use these details from next Monday.",
      });
    } catch (cause) {
      setMessage({ ok: false, text: cause instanceof Error ? cause.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="rounded-2xl border border-border bg-white p-4 sm:p-6">
      {showName ? <h2 className="mb-4 font-display text-2xl text-ink">{org.name}</h2> : null}

      <section aria-labelledby={`fees-${org.id}`}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 id={`fees-${org.id}`} className="text-base font-bold text-ink">
            What instructors pay you
          </h3>
          <span className="rounded-full bg-blush-surface px-2.5 py-1 text-xs font-bold text-ink-secondary">Set by Newdryve</span>
        </div>
        <div className="mt-3 rounded-xl border border-border bg-canvas p-4">
          <p className="text-sm font-bold text-ink">{feeModeLabel(b.fee_mode)}</p>
          <p className="mt-1 text-sm text-ink-secondary">{describeFeeTerms(b, "school")}</p>
          {isLegacyFeeMode(b.fee_mode) ? (
            <p className="mt-2 text-xs text-ink-secondary">
              These are your earlier terms. They still apply until Newdryve sets new ones with you.
            </p>
          ) : null}
          {b.fee_terms_set_at ? (
            <p className="mt-2 text-xs text-ink-muted">Set on {longDate(b.fee_terms_set_at)}.</p>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-ink-secondary">
          Newdryve agrees these terms with you when you join. To change them, contact us.
        </p>

        <label className="mt-4 flex max-w-xs flex-col gap-1.5">
          <span className={label}>Pay within</span>
          <select value={terms} onChange={(e) => setTerms(e.target.value)} className={input}>
            {[3, 7, 14, 30].map((d) => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </select>
        </label>
      </section>

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
        {busy ? "Saving…" : "Save bank and invoice details"}
      </button>
    </form>
  );
}
