"use client";

import { useState } from "react";
import {
  DEFAULT_CANCELLATION_POLICY,
  FIXED_CANCELLATION_RULES,
  LATE_FEE_OPTIONS,
  NOTICE_HOURS_OPTIONS,
  describeCancellationPolicy,
  isLateFeeBps,
  isNoticeHours,
  noticeLabel,
  policyFrom,
  type CancellationPolicyLoad,
  type LateFeeBps,
  type NoticeHours,
} from "@/lib/organisations/cancellation-policy";
import { ApiRequestError, requestJson } from "@/lib/organisations/http";

const select =
  "focus-ring w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base text-ink disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm";
const label = "text-xs font-bold uppercase tracking-[0.5px] text-ink-secondary";

export interface CancellationPolicyOrganisation {
  id: string;
  name: string;
  load: CancellationPolicyLoad;
}

/**
 * When a school's learners can cancel for free, and what they pay after that.
 *
 * One policy per school, for every instructor in it. The API snapshots the
 * policy onto each booking, so a save only reaches lessons booked afterwards.
 * Against an API deployed before this feature (404) the section shows the
 * standard policy with a note and no Save, rather than failing the page.
 */
export default function CancellationPolicyForm({ organisations }: { organisations: CancellationPolicyOrganisation[] }) {
  return (
    <div className="space-y-6">
      {organisations.map((org) => (
        <OrganisationCancellationPolicy key={org.id} org={org} showName={organisations.length > 1} />
      ))}
    </div>
  );
}

function OrganisationCancellationPolicy({ org, showName }: { org: CancellationPolicyOrganisation; showName: boolean }) {
  const { load } = org;
  const initial = load.status === "ready" ? load.policy : DEFAULT_CANCELLATION_POLICY;
  const [notice, setNotice] = useState<NoticeHours>(initial.notice_hours);
  const [lateFee, setLateFee] = useState<LateFeeBps>(initial.late_fee_bps);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const available = load.status === "ready";
  const ids = { notice: `notice-${org.id}`, lateFee: `late-fee-${org.id}`, title: `policy-${org.id}` };

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const saved = await requestJson<unknown>(
        "/organisations/api/cancellation-policy",
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ organisation_id: org.id, notice_hours: notice, late_fee_bps: lateFee }),
        },
        "Could not save your cancellation policy."
      );
      // Show what the API stored, in case it differs from what was sent.
      const policy = policyFrom(saved);
      if (policy) {
        setNotice(policy.notice_hours);
        setLateFee(policy.late_fee_bps);
      }
      setMessage({
        ok: true,
        text: "Saved. Lessons booked from now on use this policy. Lessons already booked keep the one they were booked with.",
      });
    } catch (cause) {
      setMessage({ ok: false, text: saveErrorText(cause) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} aria-labelledby={showName ? ids.title : undefined} className="rounded-2xl border border-border bg-white p-4 sm:p-6">
      {showName ? (
        <h3 id={ids.title} className="mb-4 font-display text-2xl text-ink">
          {org.name}
        </h3>
      ) : null}

      {load.status === "unavailable" ? (
        <p role="status" className="mb-5 rounded-xl bg-blush-surface px-4 py-3 text-sm text-ink">
          Setting your own cancellation policy is not available yet. Until it is, lessons use Newdryve&rsquo;s standard
          policy, shown below.
        </p>
      ) : null}

      {load.status === "error" ? (
        <p role="alert" className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {load.message} Refresh the page to try again.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.notice} className={label}>
                Notice period
              </label>
              <select
                id={ids.notice}
                value={notice}
                disabled={!available || busy}
                aria-describedby={`${ids.notice}-hint`}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (isNoticeHours(value)) setNotice(value);
                  setMessage(null);
                }}
                className={select}
              >
                {NOTICE_HOURS_OPTIONS.map((hours) => (
                  <option key={hours} value={hours}>
                    {noticeLabel(hours)}
                  </option>
                ))}
              </select>
              <p id={`${ids.notice}-hint`} className="text-xs text-ink-secondary">
                Learners can cancel for free up to this long before the lesson starts.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.lateFee} className={label}>
                Late cancellation fee
              </label>
              <select
                id={ids.lateFee}
                value={lateFee}
                disabled={!available || busy}
                aria-describedby={`${ids.lateFee}-hint`}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (isLateFeeBps(value)) setLateFee(value);
                  setMessage(null);
                }}
                className={select}
              >
                {LATE_FEE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p id={`${ids.lateFee}-hint`} className="text-xs text-ink-secondary">
                What a learner pays if they cancel after the notice period, but 30 minutes or more before the start.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-canvas p-4">
            <p className="text-sm font-bold text-ink">What learners see before they book</p>
            <p className="mt-1 text-sm text-ink-secondary">
              {describeCancellationPolicy({ notice_hours: notice, late_fee_bps: lateFee })}
            </p>
          </div>
        </>
      )}

      <div className="mt-4 rounded-xl border border-border bg-canvas p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-ink">Always the same</p>
          <span className="rounded-full bg-blush-surface px-2.5 py-1 text-xs font-bold text-ink-secondary">Set by Newdryve</span>
        </div>
        <p className="mt-1 text-sm text-ink-secondary">{FIXED_CANCELLATION_RULES}</p>
      </div>

      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className={`mt-5 rounded-xl px-4 py-3 text-sm ${message.ok ? "bg-emerald-50 font-semibold text-emerald-900" : "bg-rose-50 text-rose-800"}`}
        >
          {message.text}
        </p>
      ) : null}
      {available ? (
        <button
          type="submit"
          disabled={busy}
          className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white disabled:opacity-60 sm:w-auto"
        >
          {busy ? "Saving…" : "Save cancellation policy"}
        </button>
      ) : null}
    </form>
  );
}

/** The API's reason in the school's words, for the codes this form can meet. */
function saveErrorText(cause: unknown): string {
  if (!(cause instanceof ApiRequestError)) return "Could not save your cancellation policy.";
  if (cause.status === 404) {
    return "Setting your own cancellation policy is not available yet, so nothing was saved. Try again later.";
  }
  if (cause.code === "organisation_required") return "Choose which organisation this policy is for.";
  return cause.message;
}
