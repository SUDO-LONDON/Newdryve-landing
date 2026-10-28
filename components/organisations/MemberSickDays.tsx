"use client";

import { useEffect, useId, useState } from "react";
import { ApiRequestError, apiError, readJson, requestJson } from "@/lib/organisations/http";
import {
  earliestSickDay,
  isCalendarDate,
  previewSummary,
  recordedByLabel,
  resultMessage,
  sickDayLabel,
  sickDaysEndpoint,
  type GiveSickDayResult,
  type SickDay,
  type SickDayPreview,
} from "@/lib/organisations/sick-days";

/**
 * "Sick days" for one member of the school (Newdryve ADR-058). The school
 * gives a sick day for any day from today, with no limit on how far ahead:
 * pick a date, see what it cancels, confirm. The list shows the member's sick
 * days from today, who gave each, and removes the ones the school gave.
 */
export default function MemberSickDays({
  instructorId,
  instructorName,
  organisationId,
}: {
  instructorId: string;
  instructorName: string;
  organisationId: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Sick days for ${instructorName}`}
        className="focus-ring inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-ink hover:bg-blush-surface"
      >
        Sick days
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 text-left">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-xl"
          >
            <SickDaysPanel
              titleId={titleId}
              instructorId={instructorId}
              instructorName={instructorName}
              organisationId={organisationId}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

export function SickDaysPanel({
  titleId,
  instructorId,
  instructorName,
  organisationId,
  onClose,
}: {
  titleId?: string;
  instructorId: string;
  instructorName: string;
  organisationId: string;
  onClose?: () => void;
}) {
  const [days, setDays] = useState<SickDay[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [preview, setPreview] = useState<SickDayPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped after each change, so the list is read again.
  const [revision, setRevision] = useState(0);
  const minDate = earliestSickDay();

  useEffect(() => {
    let current = true;
    requestJson<{ sick_days?: SickDay[] }>(sickDaysEndpoint(instructorId, organisationId), { cache: "no-store" }, "Could not load sick days.")
      .then((body) => {
        if (!current) return;
        setDays(Array.isArray(body.sick_days) ? body.sick_days : []);
        setListError(null);
      })
      .catch((cause: unknown) => {
        if (current) setListError(cause instanceof Error ? cause.message : "Could not load sick days.");
      });
    return () => {
      current = false;
    };
  }, [instructorId, organisationId, revision]);

  // What the chosen day would cancel. The previous answer is cleared when the
  // date changes (chooseDate), so a stale preview never confirms a new day.
  useEffect(() => {
    if (!isCalendarDate(date)) return;
    let current = true;
    requestJson<SickDayPreview>(`${sickDaysEndpoint(instructorId, organisationId, "/preview")}&date=${date}`, { cache: "no-store" }, "Could not check that day.")
      .then((body) => {
        if (current) setPreview(body);
      })
      .catch((cause: unknown) => {
        if (current) setPreviewError(cause instanceof Error ? cause.message : "Could not check that day.");
      });
    return () => {
      current = false;
    };
  }, [date, instructorId, organisationId]);

  function chooseDate(value: string) {
    setPreview(null);
    setPreviewError(null);
    setDate(value);
  }

  async function give() {
    if (!isCalendarDate(date) || !preview?.allowed) return;
    const cancelling = preview.lessons.length;
    const ok = window.confirm(
      `Mark ${instructorName} off sick on ${sickDayLabel(date)}?\n\n` +
        (cancelling
          ? `${cancelling} lesson${cancelling === 1 ? "" : "s"} will be cancelled, free for the learners, who are told straight away. `
          : "") +
        `The day closes to new bookings and ${instructorName} is told. Cancelled lessons are not restored if the day is reopened.`
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(sickDaysEndpoint(instructorId, organisationId), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, organisation_id: organisationId }),
      });
      const body = await readJson(response);
      if (!response.ok) throw new ApiRequestError(apiError(body, response.status, "Could not give that sick day."));
      setMessage(resultMessage(body as GiveSickDayResult, instructorName, response.status === 201));
      chooseDate("");
      setRevision((n) => n + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not give that sick day.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(day: SickDay) {
    const ok = window.confirm(
      `Reopen ${sickDayLabel(day.date)} for ${instructorName}?\n\n` +
        "The day opens to new bookings again. Lessons it cancelled stay cancelled."
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(sickDaysEndpoint(instructorId, organisationId, `/${day.date}`), { method: "DELETE" });
      if (!response.ok) {
        const info = apiError(await readJson(response), response.status, "Could not reopen that day.");
        throw new Error(
          info.code === "not_given_by_school" ? `${instructorName} called in sick that day themselves, so only they can reopen it.` : info.message
        );
      }
      setMessage(`${sickDayLabel(day.date)} is open to bookings again.`);
      setRevision((n) => n + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reopen that day.");
    } finally {
      setBusy(false);
    }
  }

  const canGive = Boolean(preview?.allowed) && !busy;
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <h2 id={titleId} className="font-display text-xl text-ink">
          Sick days for {instructorName}
        </h2>
        {onClose ? (
          <button type="button" onClick={onClose} className="focus-ring rounded-full px-3 py-1 text-sm text-ink-secondary hover:bg-blush-surface">
            Close
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-ink-secondary">
        {instructorName} can call in sick in the app for today and the next 2 days. You can mark them off sick for any day
        from today, as far ahead as you need: the day closes to bookings and its lessons are cancelled free, with each
        learner told.
      </p>

      <div className="mt-4">
        <label htmlFor={`${titleId}-date`} className="mb-1 block text-sm font-medium text-ink">
          Give a sick day
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={`${titleId}-date`}
            type="date"
            min={minDate}
            value={date}
            onChange={(event) => chooseDate(event.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void give()}
            disabled={!canGive}
            className="focus-ring inline-flex min-h-11 items-center rounded-full bg-racing-green px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Give sick day"}
          </button>
        </div>
        {preview ? (
          <div className="mt-2 text-sm text-ink-secondary" aria-live="polite">
            <p>{previewSummary(preview, instructorName)}</p>
            {preview.allowed && preview.lessons.length ? (
              <ul className="mt-1 list-disc pl-5 text-xs text-ink-muted">
                {preview.lessons.map((lesson) => (
                  <li key={lesson.booking_id}>{lesson.learner_name}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {previewError ? (
          <p role="alert" className="mt-2 text-sm text-rose-800">
            {previewError}
          </p>
        ) : null}
      </div>

      {message ? (
        <p role="status" className="mt-4 rounded-lg bg-blush-surface/60 p-3 text-sm text-ink">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">Off sick from today</h3>
      {listError ? (
        <p role="alert" className="mt-2 text-sm text-rose-800">
          {listError}
        </p>
      ) : days === null ? (
        <p className="mt-2 text-sm text-ink-muted">Loading…</p>
      ) : days.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">No sick days from today.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {days.map((sickDay) => (
            <li key={sickDay.date} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div>
                <p className="text-sm font-medium text-ink">{sickDayLabel(sickDay.date)}</p>
                <p className="text-xs text-ink-muted">
                  {recordedByLabel(sickDay, instructorName)}
                  {sickDay.cancelled_count ? ` · ${sickDay.cancelled_count} lesson${sickDay.cancelled_count === 1 ? "" : "s"} cancelled` : ""}
                </p>
              </div>
              {sickDay.removable ? (
                <button
                  type="button"
                  onClick={() => void remove(sickDay)}
                  disabled={busy}
                  aria-label={`Reopen ${sickDayLabel(sickDay.date)} for ${instructorName}`}
                  className="focus-ring inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-60"
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
