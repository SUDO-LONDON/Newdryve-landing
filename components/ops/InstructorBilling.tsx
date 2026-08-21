"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { InstructorApplication } from "@/lib/ops/instructors";

export default function InstructorBilling({ applications }: { applications: InstructorApplication[] }) {
  const active = applications.filter((item) => item.tenants?.subscription_comped_forever || ["active", "trialing"].includes(item.tenants?.subscription_status || "")).length;
  const trials = applications.filter((item) => item.tenants?.subscription_status === "trialing").length;
  const freeForever = applications.filter((item) => item.tenants?.subscription_comped_forever).length;
  const awaiting = applications.filter((item) => item.status === "payment_pending").length;
  const pastDue = applications.filter((item) => item.tenants?.subscription_status === "past_due").length;
  const contractedPence = applications
    .filter((item) => !item.tenants?.subscription_comped_forever && ["active", "trialing"].includes(item.tenants?.subscription_status || ""))
    .reduce((sum, item) => sum + (item.tenants?.subscription_monthly_amount_pence || 0), 0);

  const cards = [
    ["Contracted monthly", money(contractedPence)],
    ["Active memberships", String(active)],
    ["In free trial", String(trials)],
    ["Free forever", String(freeForever)],
    ["Awaiting setup", String(awaiting)],
    ["Past due", String(pastDue)],
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">{label}</p>
            <p className="mt-2 font-display text-2xl text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="border-b border-border bg-blush-surface/50 text-[11px] uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3">Instructor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Monthly</th>
              <th className="px-4 py-3">Last paid</th>
              <th className="px-4 py-3">Paid on</th>
              <th className="px-4 py-3">Trial</th>
              <th className="px-4 py-3">Renews</th>
              <th className="px-4 py-3">Payouts</th>
              <th className="px-4 py-3">Listing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {applications.map((application) => (
              <BillingRow key={application.id} application={application} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BillingRow({ application }: { application: InstructorApplication }) {
  const router = useRouter();
  const tenant = application.tenants;
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(((tenant?.subscription_monthly_amount_pence || 2900) / 100).toFixed(2));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const comped = Boolean(tenant?.subscription_comped_forever);
  const name = application.profiles?.display_name || "Unnamed instructor";
  const trial = useMemo(() => {
    if (tenant?.subscription_comped_forever) {
      const granted = tenant.subscription_comped_at ? ` · granted ${date(tenant.subscription_comped_at)}` : "";
      const by = tenant.subscription_comped_by_email ? ` · by ${tenant.subscription_comped_by_email}` : "";
      return `Free forever${granted}${by}`;
    }
    if (!tenant?.subscription_trial_months) return "None";
    const end = tenant.subscription_trial_ends_at ? ` · ends ${date(tenant.subscription_trial_ends_at)}` : " · not started";
    const source = tenant.subscription_trial_source ? ` · ${tenant.subscription_trial_source.replaceAll("_", " ")}` : "";
    return `${tenant.subscription_trial_months} mo${source}${end}`;
  }, [tenant]);

  async function saveAmount() {
    const pence = Math.round(Number(amount) * 100);
    if (!Number.isFinite(pence) || pence < 100 || pence > 100000) {
      setError("Enter an amount from £1 to £1,000.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/ops/api/instructors/${application.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "update_billing", monthly_amount_pence: pence }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not update the monthly amount.");
      setEditing(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the monthly amount.");
    } finally {
      setBusy(false);
    }
  }

  async function grantFreeForever() {
    const warning = tenant?.subscription_status === "active" || tenant?.subscription_status === "trialing"
      ? "Grant this instructor free membership forever? Their current Stripe membership will be cancelled immediately and they will not be charged again."
      : "Grant this instructor free membership forever? They will get immediate access without entering a card and will never be charged the Newdryve membership fee.";
    if (!window.confirm(warning)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/ops/api/instructors/${application.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "grant_free_forever" }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not grant free-forever membership.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not grant free-forever membership.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="align-top">
      <td className="px-4 py-4">
        <p className="font-semibold text-ink">{name}</p>
        <p className="text-xs text-ink-muted">{application.profiles?.email || "—"}</p>
        {error ? <p className="mt-1 max-w-52 text-xs text-deep-rose-ink">{error}</p> : null}
      </td>
      <td className="px-4 py-4"><BillingPill status={tenant?.subscription_status || "none"} awaiting={application.status === "payment_pending"} freeForever={comped} /></td>
      <td className="px-4 py-4">
        {comped ? (
          <span className="font-semibold text-racing-green">Free forever</span>
        ) : editing ? (
          <div className="flex items-center gap-1">
            <span>£</span>
            <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" max="1000" step="0.01" className="w-20 rounded border border-border px-2 py-1" />
            <button type="button" onClick={saveAmount} disabled={busy} className="rounded bg-racing-green px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">{busy ? "…" : "Save"}</button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <button type="button" onClick={() => setEditing(true)} className="font-semibold text-racing-green underline decoration-racing-green/30 underline-offset-4">
              {money(tenant?.subscription_monthly_amount_pence || 0)}
            </button>
            <button type="button" disabled={busy} onClick={grantFreeForever} className="text-xs font-semibold text-ink-muted underline decoration-border underline-offset-4 disabled:opacity-50">
              {busy ? "Updating…" : "Grant free forever"}
            </button>
          </div>
        )}
      </td>
      <td className="px-4 py-4 text-ink-secondary">{tenant?.subscription_last_amount_paid_pence == null ? "—" : money(tenant.subscription_last_amount_paid_pence)}</td>
      <td className="px-4 py-4 text-ink-secondary">{date(tenant?.subscription_last_paid_at)}</td>
      <td className="max-w-64 px-4 py-4 text-ink-secondary">
        <p>{trial}</p>
        {tenant?.subscription_trial_note ? <p className="mt-1 text-xs text-ink-muted">{tenant.subscription_trial_note}</p> : null}
      </td>
      <td className="px-4 py-4 text-ink-secondary">{comped ? "Never" : date(tenant?.subscription_current_period_end)}</td>
      <td className="px-4 py-4 text-ink-secondary">{tenant?.connect_status === "onboarded" ? "Ready" : "Not connected"}</td>
      <td className="px-4 py-4 text-ink-secondary">{application.is_listed ? "Listed" : application.listing_approved ? "Approved, waiting" : "Not approved"}</td>
    </tr>
  );
}

function BillingPill({ status, awaiting, freeForever }: { status: string; awaiting: boolean; freeForever: boolean }) {
  const label = freeForever ? "Free forever" : awaiting && status === "none" ? "Awaiting setup" : status.replaceAll("_", " ");
  const tone = freeForever || status === "active" || status === "trialing"
    ? "bg-racing-green/10 text-racing-green"
    : status === "past_due" || status === "unpaid"
      ? "bg-deep-rose/10 text-deep-rose-ink"
      : "bg-amber-100 text-amber-900";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>{label}</span>;
}

function money(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function date(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
