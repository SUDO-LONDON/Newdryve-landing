"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApplicationStatus, InstructorApplication } from "@/lib/ops/instructors";

/**
 * Founder-facing approve / reject / reinstate for instructor applications.
 *
 * Every action posts to /ops/api/instructors/[id], which re-verifies the
 * founder session server-side before calling the live API. Nothing here talks
 * to the product database directly.
 */
export default function InstructorApprovals({
  applications,
  status,
}: {
  applications: InstructorApplication[];
  status: ApplicationStatus;
}) {
  return (
    <div className="flex flex-col gap-4">
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} status={status} />
      ))}
    </div>
  );
}

function ApplicationCard({
  application,
  status,
}: {
  application: InstructorApplication;
  status: ApplicationStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [approvalStep, setApprovalStep] = useState<0 | 1 | 2>(0);
  const [monthlyAmount, setMonthlyAmount] = useState("29.00");
  const [trialMonths, setTrialMonths] = useState(0);
  const [trialSource, setTrialSource] = useState<"word_of_mouth" | "referral" | "other" | "">("");
  const [trialNote, setTrialNote] = useState("");

  // Default the verification ticks to whatever was actually uploaded, so the
  // common case is one click, but the founder still has to look before they do.
  const [adiVerified, setAdiVerified] = useState(application.documents.adi.uploaded);
  const [dbsVerified, setDbsVerified] = useState(application.documents.dbs.uploaded);
  const [listNow, setListNow] = useState(false);

  const name = application.profiles?.display_name || "Unnamed applicant";
  const email = application.profiles?.email || "—";
  const phone = application.profiles?.phone_e164;
  const areas = application.service_areas ?? [];
  const missingDocuments =
    !application.documents.adi.uploaded || !application.documents.dbs.uploaded;

  async function act(action: "approve" | "reject" | "reinstate" | "resend_activation", extra: Record<string, unknown> = {}) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/ops/api/instructors/${application.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || "That didn't work. Try again.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Try again.");
      setBusy(null);
    }
  }

  return (
    <article className="rounded-xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg text-ink">{name}</h2>
          <p className="text-sm text-ink-secondary">
            {email}
            {phone ? ` · ${phone}` : ""}
          </p>
          <p className="mt-1 text-sm text-ink-secondary">
            {areas.length ? areas.join(", ") : "No areas given"} ·{" "}
            {formatPrice(application.price_per_hour_pence)}/hr ·{" "}
            {(application.transmissions ?? []).join(" & ") || "no transmission set"}
          </p>
        </div>
        <StatusPill status={application.status} appliedAt={application.applied_at} />
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
        <Field label="ADI number" value={application.adi_number} />
        <Field label="Trading as" value={application.tenants?.display_name} />
        <Field
          label="Car"
          value={[application.car_make, application.car_model, application.car_color]
            .filter(Boolean)
            .join(" ")}
        />
        <Field label="Specialisms" value={(application.specialisms ?? []).join(", ")} />
      </dl>

      {application.bio ? (
        <p className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm text-ink-secondary">
          {application.bio}
        </p>
      ) : null}

      {application.application_notes ? (
        <div className="mt-3 rounded-lg bg-blush-surface p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
            Their notes
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-secondary">
            {application.application_notes}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
        <DocumentLink label="ADI certificate" document={application.documents.adi} />
        <DocumentLink label="DBS certificate" document={application.documents.dbs} />
      </div>

      {status === "pending" ? (
        <div className="mt-4 border-t border-border pt-4">
          {missingDocuments ? (
            <p className="mb-3 rounded-lg bg-blush-surface px-3 py-2 text-sm text-ink-secondary">
              A certificate is missing. You can still approve, but you&rsquo;d be doing it without
              seeing the paperwork.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-4">
            <Toggle label="ADI verified" checked={adiVerified} onChange={setAdiVerified} />
            <Toggle label="DBS verified" checked={dbsVerified} onChange={setDbsVerified} />
            <Toggle label="List after membership and payouts are ready" checked={listNow} onChange={setListNow} />
          </div>

          {rejecting ? (
            <div className="mt-4 flex flex-col gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
                Reason (optional, included in the rejection email if enabled)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => act("reject", { reason })}
                  className="rounded-lg bg-deep-rose px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy === "reject" ? "Rejecting..." : "Confirm rejection"}
                </button>
                <button
                  type="button"
                  onClick={() => setRejecting(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : approvalStep > 0 ? (
            <div className="mt-4 rounded-xl border border-racing-green/20 bg-racing-green/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-racing-green">
                    Step {approvalStep} of 2
                  </p>
                  <h3 className="mt-1 font-display text-lg text-ink">
                    {approvalStep === 1 ? "Membership terms" : "Approve and send email"}
                  </h3>
                </div>
                <button type="button" onClick={() => setApprovalStep(0)} className="text-sm text-ink-muted hover:text-ink">
                  Cancel
                </button>
              </div>

              {approvalStep === 1 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-ink">
                    Monthly amount
                    <div className="mt-1 flex rounded-lg border border-border bg-white focus-within:border-racing-green">
                      <span className="px-3 py-2 text-ink-muted">£</span>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        step="0.01"
                        value={monthlyAmount}
                        onChange={(event) => setMonthlyAmount(event.target.value)}
                        className="min-w-0 flex-1 rounded-r-lg bg-transparent px-1 py-2 text-ink outline-none"
                      />
                    </div>
                  </label>
                  <label className="text-sm font-medium text-ink">
                    Free trial
                    <select
                      value={trialMonths}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        setTrialMonths(next);
                        if (next === 0) {
                          setTrialSource("");
                          setTrialNote("");
                        }
                      }}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink"
                    >
                      <option value={0}>No trial</option>
                      <option value={1}>1 month</option>
                      <option value={2}>2 months</option>
                      <option value={3}>3 months</option>
                    </select>
                  </label>

                  {trialMonths > 0 ? (
                    <>
                      <label className="text-sm font-medium text-ink">
                        Why was the trial granted?
                        <select
                          value={trialSource}
                          onChange={(event) => setTrialSource(event.target.value as typeof trialSource)}
                          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink"
                        >
                          <option value="">Select a source</option>
                          <option value="word_of_mouth">Word of mouth</option>
                          <option value="referral">Referral</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                      <label className="text-sm font-medium text-ink">
                        Trial note <span className="font-normal text-ink-muted">(optional)</span>
                        <input
                          value={trialNote}
                          maxLength={500}
                          onChange={(event) => setTrialNote(event.target.value)}
                          placeholder="Who referred them or what was agreed"
                          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink"
                        />
                      </label>
                    </>
                  ) : null}

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="button"
                      disabled={!Number.isFinite(Number(monthlyAmount)) || Number(monthlyAmount) < 1 || (trialMonths > 0 && !trialSource)}
                      onClick={() => setApprovalStep(2)}
                      className="rounded-lg bg-racing-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Review approval
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <dl className="grid gap-2 rounded-lg bg-white p-4 text-sm sm:grid-cols-2">
                    <Field label="Instructor" value={name} />
                    <Field label="Monthly price" value={`${formatPrice(Math.round(Number(monthlyAmount) * 100))}/month`} />
                    <Field label="Trial" value={trialMonths ? `${trialMonths} month${trialMonths === 1 ? "" : "s"}` : "None"} />
                    <Field label="Trial source" value={trialSource ? trialSource.replaceAll("_", " ") : "—"} />
                  </dl>
                  <p className="mt-3 text-sm leading-6 text-ink-secondary">
                    This will approve the documents, keep the account locked, and email a secure Stripe setup link. Access unlocks only after Stripe confirms setup.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button type="button" onClick={() => setApprovalStep(1)} className="rounded-lg border border-border px-4 py-2 text-sm text-ink">
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => act("approve", {
                        adi_verified: adiVerified,
                        dbs_verified: dbsVerified,
                        is_listed: listNow,
                        monthly_amount_pence: Math.round(Number(monthlyAmount) * 100),
                        trial_months: trialMonths,
                        trial_source: trialSource || null,
                        trial_note: trialNote.trim() || null,
                      })}
                      className="rounded-lg bg-racing-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {busy === "approve" ? "Approving…" : "Approve and send email"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setApprovalStep(1)}
                className="rounded-lg bg-racing-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy === "approve" ? "Approving..." : "Approve"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setRejecting(true)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-ink hover:bg-blush-surface"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ) : null}

      {status === "rejected" ? (
        <div className="mt-4 border-t border-border pt-4">
          {application.rejection_reason ? (
            <p className="mb-3 text-sm text-ink-secondary">
              Reason given: {application.rejection_reason}
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => act("reinstate")}
            className="rounded-lg border border-border px-4 py-2 text-sm text-ink hover:bg-blush-surface disabled:opacity-60"
          >
            {busy === "reinstate" ? "Reinstating..." : "Reinstate to pending"}
          </button>
        </div>
      ) : null}

      {status === "active" ? (
        <p className="mt-4 border-t border-border pt-4 text-sm text-ink-secondary">
          Approved{application.approved_by_email ? ` by ${application.approved_by_email}` : ""}
          {application.approved_at ? ` on ${formatDate(application.approved_at)}` : ""}.
          {application.is_listed ? " Listed in the marketplace." : " Not listed yet."}
        </p>
      ) : null}

      {status === "payment_pending" ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>
            Approved{application.approved_at ? ` on ${formatDate(application.approved_at)}` : ""}; waiting for Stripe membership setup.
            {application.tenants ? ` Terms: ${formatPrice(application.tenants.subscription_monthly_amount_pence)}/month${application.tenants.subscription_trial_months ? ` after a ${application.tenants.subscription_trial_months}-month trial` : ""}.` : ""}
          </p>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => act("resend_activation")}
            className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-950 disabled:opacity-60"
          >
            {busy === "resend_activation" ? "Sending…" : "Resend payment email"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-deep-rose-ink">
          {error}
        </p>
      ) : null}
    </article>
  );
}

function DocumentLink({
  label,
  document,
}: {
  label: string;
  document: { uploaded: boolean; url: string | null };
}) {
  if (!document.uploaded || !document.url) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-ink-muted">
        {label} — not uploaded
      </span>
    );
  }
  return (
    <a
      href={document.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-blush-surface"
    >
      View {label}
    </a>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-border accent-racing-green"
      />
      {label}
    </label>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="min-w-0 truncate text-ink-secondary">{value || "—"}</dd>
    </div>
  );
}

function StatusPill({ status, appliedAt }: { status: string; appliedAt: string | null }) {
  const styles: Record<string, string> = {
    pending: "bg-blush-surface text-ink",
    payment_pending: "bg-amber-100 text-amber-900",
    active: "bg-racing-green/10 text-racing-green",
    rejected: "bg-deep-rose/10 text-deep-rose-ink",
  };
  return (
    <div className="text-right">
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
          styles[status] ?? "bg-blush-surface text-ink"
        }`}
      >
        {status === "active" ? "approved" : status === "payment_pending" ? "awaiting payment" : status}
      </span>
      {appliedAt ? (
        <p className="mt-1 text-xs text-ink-muted">Applied {formatDate(appliedAt)}</p>
      ) : null}
    </div>
  );
}

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2).replace(/\.00$/, "")}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
