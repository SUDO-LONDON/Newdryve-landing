"use client";

import { useState } from "react";
import {
  CANCEL_NOTICE_HOURS,
  LATE_CANCEL_FEE_BPS,
  describePolicy,
  draftFromPolicy,
  lateFeeLabel,
  noticeLabel,
  policyInputFromDraft,
  type CancellationPolicyDraft,
  type CancellationPolicyResponse,
} from "@/lib/organisations/cancellation-policy";
import { apiError, readJson } from "@/lib/organisations/http";

const input =
  "focus-ring w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base text-ink sm:text-sm";
const label = "text-xs font-bold uppercase tracking-[0.5px] text-ink-secondary";

export interface SchoolPolicy {
  id: string;
  name: string;
  /** Null when the policy could not be read; the form then says so instead of guessing. */
  policy: CancellationPolicyResponse | null;
  error?: string | null;
}

/**
 * The school's cancellation policy (ADR-044): how much notice a learner must
 * give, and what a later cancellation costs. It applies to every booking made
 * with the school's members from the change on, and members cannot set their
 * own while it applies. Saved with PUT /v1/organisations/me/cancellation-policy.
 */
export default function CancellationPolicyForm({ schools }: { schools: SchoolPolicy[] }) {
  return (
    <section aria-labelledby="cancellation-title" className="mt-8">
      <h2 id="cancellation-title" className="font-display text-2xl text-ink">
        Cancellation policy
      </h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-secondary">
        How much notice learners must give to cancel a lesson with your instructors, and what a later cancellation costs.
        It applies to every lesson booked from the moment you save; lessons already booked keep the policy they were
        booked under. Your instructors can&rsquo;t change it in the app while it applies.
      </p>
      <div className="mt-4 space-y-6">
        {schools.map((school) => (
          <SchoolPolicyForm key={school.id} school={school} showName={schools.length > 1} />
        ))}
      </div>
    </section>
  );
}

function SchoolPolicyForm({ school, showName }: { school: SchoolPolicy; showName: boolean }) {
  const [saved, setSaved] = useState(school.policy);
  const [draft, setDraft] = useState<CancellationPolicyDraft>(() =>
    draftFromPolicy(school.policy?.cancellation_policy ?? { notice_hours: 24, late_fee_bps: 5000 })
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    school.policy ? null : { ok: false, text: school.error || "Could not load your cancellation policy. Reload to try again." }
  );

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const checked = policyInputFromDraft(school.id, draft);
    if (!checked.ok) {
      setMessage({ ok: false, text: checked.error });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/organisations/api/cancellation-policy", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(checked.input),
      });
      const json = await readJson(res);
      if (!res.ok) throw new Error(apiError(json, res.status, "Could not save the cancellation policy.").message);
      const next = json as CancellationPolicyResponse;
      setSaved(next);
      setDraft(draftFromPolicy(next.cancellation_policy));
      setMessage({
        ok: true,
        text: next.applied
          ? "Saved. New bookings with your instructors use this policy from now on."
          : "Saved. It applies once Newdryve reactivates your school.",
      });
    } catch (cause) {
      setMessage({ ok: false, text: cause instanceof Error ? cause.message : "Could not save the cancellation policy." });
    } finally {
      setBusy(false);
    }
  }

  const preview = policyInputFromDraft(school.id, draft);

  return (
    <form onSubmit={save} className="rounded-2xl border border-border bg-white p-4 sm:p-6" aria-label={`Cancellation policy for ${school.name}`}>
      {showName ? <h3 className="mb-4 font-display text-xl text-ink">{school.name}</h3> : null}
      {saved && !saved.applied ? (
        <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Your school is paused, so each instructor&rsquo;s own policy applies for now. This one comes back when Newdryve
          reactivates the school.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={label}>Notice needed to cancel</span>
          <select
            value={draft.notice_hours}
            onChange={(e) => setDraft((d) => ({ ...d, notice_hours: e.target.value }))}
            className={input}
          >
            {CANCEL_NOTICE_HOURS.map((h) => (
              <option key={h} value={h}>
                {noticeLabel(h)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>Late cancellation fee</span>
          <select
            value={draft.late_fee_bps}
            onChange={(e) => setDraft((d) => ({ ...d, late_fee_bps: e.target.value }))}
            className={input}
          >
            {LATE_CANCEL_FEE_BPS.map((bps) => (
              <option key={bps} value={bps}>
                {lateFeeLabel(bps)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {preview.ok ? <p className="mt-3 text-sm text-ink-secondary">{describePolicy(preview.input)}</p> : null}
      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${message.ok ? "bg-emerald-50 font-semibold text-emerald-900" : "bg-rose-50 text-rose-800"}`}
        >
          {message.text}
        </p>
      ) : null}
      <button
        type="submit"
        // Never save over a policy that could not be read: the selects would
        // only be showing the default.
        disabled={busy || !saved}
        className="focus-ring mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Saving…" : "Save cancellation policy"}
      </button>
    </form>
  );
}
