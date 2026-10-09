"use client";

/**
 * Every learner, per instructor, laid out like a GitHub contribution graph:
 * one square a day for the last 26 weeks, darker for more hours taught, red
 * where the instructor cancelled or declined. A learner taught a few hours and
 * then left with nothing booked shows up as a short streak and a long blank.
 *
 * Flags only point. A learner who stopped may have passed or moved, so the
 * school decides whether to nudge, and the nudge goes to the instructor.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { LearnerRow, LearnersResponse } from "@/lib/organisations/types";
import { addDays, day, hours, londonToday, mondayOf, monthShort, shortDate } from "@/lib/organisations/format";

type Filter = "attention" | "all";

export default function LearnerSheet({ data }: { data: LearnersResponse }) {
  const flagged = data.learners.filter((l) => l.flags.length);
  const [filter, setFilter] = useState<Filter>(flagged.length ? "attention" : "all");
  const [instructor, setInstructor] = useState("all");
  const [rows, setRows] = useState(data.learners);
  const loadedAt = Date.parse(data.generated_at);

  const visible = useMemo(
    () =>
      rows.filter(
        (l) => (filter === "all" || l.flags.length > 0) && (instructor === "all" || l.instructor_id === instructor)
      ),
    [rows, filter, instructor]
  );

  const markNudged = (row: LearnerRow) =>
    setRows((all) =>
      all.map((r) =>
        r.instructor_id === row.instructor_id && r.student_id === row.student_id
          ? { ...r, nudges: r.nudges + 1, last_nudged_at: new Date().toISOString() }
          : r
      )
    );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Which learners" className="inline-grid grid-cols-2 rounded-full border border-border bg-white p-1">
          {(
            [
              ["attention", `Needs attention (${flagged.length})`],
              ["all", `All learners (${data.learners.length})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={filter === value}
              onClick={() => setFilter(value)}
              className={`focus-ring min-h-10 rounded-full px-4 text-sm font-bold ${filter === value ? "bg-racing-green text-white" : "text-ink-secondary"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {data.instructors.length > 1 ? (
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            Instructor
            <select
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              className="focus-ring min-h-11 rounded-lg border border-border bg-white px-3 text-sm"
            >
              <option value="all">All instructors</option>
              {data.instructors.map((i) => (
                <option key={i.instructor_id} value={i.instructor_id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <Legend />

      {visible.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-border bg-white p-8 text-center text-sm text-ink-secondary">
          {filter === "attention"
            ? "No learners need attention right now. Everyone taught recently has a lesson booked."
            : "No learners yet."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((row) => (
            <LearnerCard key={`${row.instructor_id}:${row.student_id}`} row={row} weeks={data.weeks} now={loadedAt} onNudged={markNudged} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-secondary">
      <span className="flex items-center gap-1">
        Less
        {[0, 45, 90, 150].map((m) => (
          <span key={m} className={`size-3 rounded-[3px] ${shade(m)}`} />
        ))}
        More taught
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-[3px] bg-rose-600" /> Cancelled or declined by instructor
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-[3px] bg-canvas ring-2 ring-inset ring-amber-500" /> Cancelled by learner
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-[3px] bg-ink-secondary" /> No-show
      </span>
    </div>
  );
}

function shade(minutes: number): string {
  if (minutes <= 0) return "bg-canvas";
  if (minutes <= 60) return "bg-emerald-200";
  if (minutes <= 120) return "bg-emerald-500";
  return "bg-racing-green";
}

function LearnerCard({ row, weeks, now, onNudged }: { row: LearnerRow; weeks: number; now: number; onNudged: (row: LearnerRow) => void }) {
  const firstName = row.instructor_name.split(/\s+/)[0] || "the instructor";
  // Measured from when the page loaded; a nudge sent here is tracked by the panel itself.
  const nudgedRecently = row.last_nudged_at != null && now - Date.parse(row.last_nudged_at) < 86_400_000;
  const act = row.flags.some((f) => f.severity === "act");

  return (
    <li className={`rounded-2xl border bg-white p-4 sm:p-5 ${act ? "border-rose-300" : "border-border"}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-base font-bold text-ink">
            {row.learner_name} <span className="font-normal text-ink-secondary">with {row.instructor_name}</span>
          </p>
          <p className="mt-0.5 text-xs text-ink-secondary">
            {hours(row.completed_minutes)} taught · {row.lessons} lesson{row.lessons === 1 ? "" : "s"}
            {row.last_lesson_at ? ` · last ${shortDate(row.last_lesson_at)}${row.days_since_last_lesson != null ? ` (${row.days_since_last_lesson} days ago)` : ""}` : " · no lessons yet"}
            {row.next_lesson_at ? ` · next ${shortDate(row.next_lesson_at)}` : " · nothing booked"}
          </p>
        </div>
        {row.flags.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {row.flags.map((flag) => (
              <li
                key={flag.code}
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${flag.severity === "act" ? "bg-rose-100 text-rose-900" : "bg-amber-100 text-amber-900"}`}
              >
                {flag.code === "gone_quiet" ? "Gone quiet" : "Cancelled by instructor"}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {row.flags.length ? (
        <ul className="mt-2 space-y-0.5 text-sm text-ink">
          {row.flags.map((flag) => (
            <li key={flag.code}>{flag.label}.</li>
          ))}
          {row.learner_cancelled_last ? <li className="text-ink-secondary">The learner cancelled the most recent cancelled lesson themselves.</li> : null}
        </ul>
      ) : null}

      <ActivityGrid row={row} weeks={weeks} />

      <NudgePanel row={row} firstName={firstName} disabled={nudgedRecently} onNudged={onNudged} />
    </li>
  );
}

const ROW_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

function ActivityGrid({ row, weeks }: { row: LearnerRow; weeks: number }) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const today = londonToday();
  const firstMonday = addDays(mondayOf(today), -(weeks - 1) * 7);
  const byDate = useMemo(() => new Map(row.days.map((d) => [d.date, d])), [row.days]);

  // Most recent weeks matter most; on a narrow phone start scrolled to them.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const columns = Array.from({ length: weeks }, (_, w) => addDays(firstMonday, w * 7));
  const summary = `${row.learner_name} with ${row.instructor_name}, last ${weeks} weeks: ${hours(row.completed_minutes)} taught, ${row.instructor_cancellations} cancelled by the instructor, ${row.learner_cancellations} cancelled by the learner.`;

  return (
    <div ref={scroller} className="mt-4 overflow-x-auto pb-1">
      <div role="img" aria-label={summary} className="inline-flex gap-[3px]">
        {/* Pinned, so the day labels stay put while the weeks scroll. */}
        <div className="sticky left-0 z-10 grid grid-rows-[12px_repeat(7,11px)] gap-[3px] bg-white pr-1 text-[10px] leading-[11px] text-ink-secondary">
          <span />
          {ROW_LABELS.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
        {columns.map((monday, w) => {
          const month = monthShort(monday);
          const prevMonth = w > 0 ? monthShort(columns[w - 1]!) : null;
          return (
            <div key={monday} className="grid grid-rows-[12px_repeat(7,11px)] gap-[3px]">
              <span className="w-[11px] overflow-visible whitespace-nowrap text-[10px] leading-[11px] text-ink-secondary">
                {month !== prevMonth ? month : ""}
              </span>
              {Array.from({ length: 7 }, (_, d) => {
                const date = addDays(monday, d);
                if (date > today) return <span key={date} className="size-[11px]" />;
                const cell = byDate.get(date);
                const label = [
                  day(date),
                  cell?.minutes ? `${hours(cell.minutes)} taught` : null,
                  cell?.instructor_cancelled ? `${cell.instructor_cancelled} cancelled by instructor` : null,
                  cell?.learner_cancelled ? `${cell.learner_cancelled} cancelled by learner` : null,
                  cell?.no_show ? "no-show" : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                const colour = cell?.instructor_cancelled && !cell.minutes
                  ? "bg-rose-600"
                  : cell?.no_show && !cell.minutes
                    ? "bg-ink-secondary"
                    : shade(cell?.minutes ?? 0);
                const ring = cell?.learner_cancelled ? "ring-2 ring-inset ring-amber-500" : "";
                return <span key={date} title={label} className={`size-[11px] rounded-[3px] ${colour} ${ring}`} />;
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NudgePanel({
  row,
  firstName,
  disabled,
  onNudged,
}: {
  row: LearnerRow;
  firstName: string;
  disabled: boolean;
  onNudged: (row: LearnerRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(`Please check in with ${row.learner_name} and get their next lesson booked.`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/organisations/api/nudges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instructor_id: row.instructor_id, student_id: row.student_id, message: message.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not send the nudge.");
      setDone(true);
      setOpen(false);
      onNudged(row);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send the nudge.");
    } finally {
      setBusy(false);
    }
  }

  if (done || disabled) {
    return (
      <p className="mt-3 text-sm font-semibold text-racing-green" role="status">
        {done ? `Nudge sent to ${firstName}.` : `Nudged ${shortDate(row.last_nudged_at)}. You can nudge again tomorrow.`}
      </p>
    );
  }

  return (
    <div className="mt-3">
      {open ? (
        <div className="rounded-xl border border-border bg-canvas p-3">
          <label className="text-xs font-bold uppercase tracking-[0.5px] text-ink-secondary" htmlFor={`nudge-${row.instructor_id}-${row.student_id}`}>
            Message to {firstName}
          </label>
          <textarea
            id={`nudge-${row.instructor_id}-${row.student_id}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
            className="focus-ring mt-1.5 w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-base sm:text-sm"
          />
          <p className="mt-1 text-xs text-ink-secondary">Sent to {firstName}&rsquo;s app and email, from your school.</p>
          {error ? (
            <p role="alert" className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy || !message.trim()}
              className="focus-ring inline-flex min-h-11 items-center rounded-full bg-racing-green px-5 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send nudge"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="focus-ring inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-ink">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`focus-ring inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold ${
            row.flags.length ? "bg-racing-green text-white" : "border border-border text-ink"
          }`}
        >
          Nudge {firstName}
        </button>
      )}
    </div>
  );
}
