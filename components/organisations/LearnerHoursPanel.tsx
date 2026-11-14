"use client";

import { useState } from "react";
import { apiError, readJson } from "@/lib/organisations/http";
import { HOURS_STATE_LABEL, adjustmentFromText, hoursText, type LearnerHours } from "@/lib/organisations/packages";

const input = "focus-ring w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base text-ink sm:text-sm";
const label = "text-xs font-bold uppercase tracking-[0.5px] text-ink-secondary";
const quiet =
  "focus-ring inline-flex min-h-11 items-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-ink hover:bg-blush-surface disabled:opacity-60";

// With the year: a package lasts a year or more, so "14 Nov" alone does not say which.
const USE_BY = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", year: "numeric" });
function expiryLabel(iso: string): string {
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? "" : `use by ${USE_BY.format(at)}`;
}

export interface LearnerHoursPanelProps {
  organisationId: string;
  items: LearnerHours[];
}

/**
 * Each learner's hours with the school: what they bought, what is left, and
 * what is booked. The school can correct the hours (lessons taught before the
 * learner was added, an hour given back) or cancel a package. Lessons already
 * taught or booked with a package always stand.
 */
export default function LearnerHoursPanel({ organisationId, items }: LearnerHoursPanelProps) {
  const [rows, setRows] = useState<LearnerHours[]>(items);
  const [editing, setEditing] = useState<string | null>(null);
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function patch(row: LearnerHours, body: Record<string, unknown>, fallback: string): Promise<LearnerHours> {
    const res = await fetch(`/organisations/api/learner-packages/${row.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organisation_id: organisationId, ...body }),
    });
    const json = await readJson(res);
    if (!res.ok) throw new Error(apiError(json, res.status, fallback).message);
    const item = (json as { item?: Partial<LearnerHours> } | null)?.item;
    if (!item) throw new Error(fallback);
    // The answer carries the new balance; who the learner is does not change.
    return { ...row, ...item, learner_name: row.learner_name, learner_phone_e164: row.learner_phone_e164, has_account: row.has_account };
  }

  function open(row: LearnerHours) {
    setMessage(null);
    setEditing(row.id);
    setHours(row.minutes_adjusted ? hoursText(row.minutes_adjusted) : "");
    setNote(row.adjust_note ?? "");
  }

  async function saveCorrection(event: React.FormEvent, row: LearnerHours) {
    event.preventDefault();
    setMessage(null);
    const checked = adjustmentFromText(hours);
    if (!checked.ok) {
      setMessage({ ok: false, text: checked.error });
      return;
    }
    setBusy(row.id);
    try {
      const saved = await patch(row, { minutes_adjusted: checked.minutes, adjust_note: note.trim() || null }, "Could not correct the hours.");
      setRows((list) => list.map((r) => (r.id === row.id ? { ...saved, minutes_adjusted: checked.minutes, adjust_note: note.trim() || null } : r)));
      setEditing(null);
      setMessage({ ok: true, text: `Saved. ${row.learner_name ?? "The learner"} now has ${saved.hours_left_label} left.` });
    } catch (cause) {
      setMessage({ ok: false, text: cause instanceof Error ? cause.message : "Could not correct the hours." });
    } finally {
      setBusy(null);
    }
  }

  async function cancel(row: LearnerHours) {
    const sure = window.confirm(
      `Cancel ${row.learner_name ?? "this learner"}'s ${row.name}? They will not be able to book with the hours that are left. Lessons already booked with it stay in the diary.`
    );
    if (!sure) return;
    setMessage(null);
    setBusy(row.id);
    try {
      const saved = await patch(row, { voided: true }, "Could not cancel the package.");
      setRows((list) => list.map((r) => (r.id === row.id ? saved : r)));
      setEditing(null);
      setMessage({ ok: true, text: "Package cancelled. Any refund is between you and the learner." });
    } catch (cause) {
      setMessage({ ok: false, text: cause instanceof Error ? cause.message : "Could not cancel the package." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="learner-hours-heading" className="rounded-2xl border border-border bg-white p-4 sm:p-6">
      <h2 id="learner-hours-heading" className="font-display text-xl text-ink">
        Learners&rsquo; hours
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-secondary">
        Everyone who has bought a package from you. The hours left are worked out from their lessons: a cancelled lesson
        gives its hours back, and a no-show uses them. Each learner sees the same number in the app.
      </p>

      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${message.ok ? "bg-emerald-50 font-semibold text-emerald-900" : "bg-rose-50 text-rose-800"}`}
        >
          {message.text}
        </p>
      ) : null}

      {rows.length ? (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {row.learner_name ?? "Learner"}
                    {row.has_account ? null : (
                      <span className="ml-2 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                        Not confirmed in the app yet
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {[row.name, row.learner_phone_e164, expiryLabel(row.expires_at)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-semibold text-ink">
                    {row.state === "active" ? `${row.hours_left_label} left` : HOURS_STATE_LABEL[row.state]}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    of {row.hours_total_label}
                    {row.minutes_booked > 0 ? ` · ${hoursText(row.minutes_booked)}h booked` : ""}
                    {row.minutes_adjusted ? ` · corrected by ${row.minutes_adjusted > 0 ? "+" : ""}${hoursText(row.minutes_adjusted)}h` : ""}
                  </p>
                </div>
              </div>
              {row.state === "voided" ? null : editing === row.id ? (
                <form
                  onSubmit={(event) => saveCorrection(event, row)}
                  aria-label={`Correct ${row.learner_name ?? "the learner"}'s hours`}
                  className="mt-3 grid gap-3 rounded-xl border border-border bg-canvas p-3 sm:grid-cols-2"
                >
                  <label className="flex flex-col gap-1.5">
                    <span className={label}>Correction (hours)</span>
                    <input className={input} inputMode="text" value={hours} placeholder="-4" onChange={(e) => setHours(e.target.value)} />
                    <span className="text-xs text-ink-muted">
                      A minus for hours they had already used before you added them, for example -4. A plus for hours you give back.
                      Empty for none.
                    </span>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className={label}>Note (optional)</span>
                    <input className={input} value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
                  </label>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button
                      type="submit"
                      disabled={busy !== null}
                      className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-racing-green px-5 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {busy === row.id ? "Saving…" : "Save correction"}
                    </button>
                    <button type="button" onClick={() => setEditing(null)} disabled={busy !== null} className={quiet}>
                      Close
                    </button>
                    <button type="button" onClick={() => cancel(row)} disabled={busy !== null} className={`${quiet} text-rose-800`}>
                      Cancel this package
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => open(row)}
                  disabled={busy !== null}
                  className={`${quiet} mt-2`}
                  aria-label={`Correct ${row.learner_name ?? "the learner"}'s hours`}
                >
                  Correct hours
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink-secondary">
          Nobody yet. A learner appears here as soon as your office books them from WhatsApp and says which package they
          paid for.
        </p>
      )}
    </section>
  );
}
