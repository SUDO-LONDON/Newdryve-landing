"use client";

/**
 * What every instructor is doing right now, and when they are next free.
 *
 * Every status is read from something the app has already told Newdryve, so
 * it is only as fresh as the instructor's last sync: a lesson started with no
 * signal shows as "Lesson due" until the phone reconnects. The page says when
 * it last updated rather than implying it is live to the second.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LiveInstructor, LiveResponse, LiveStatusCode } from "@/lib/organisations/types";
import { hours, time } from "@/lib/organisations/format";

const POLL_MS = 30_000;

const TONE: Record<LiveStatusCode, { pill: string; dot: string }> = {
  in_lesson: { pill: "bg-racing-green text-white", dot: "bg-white" },
  wrapping_up: { pill: "bg-emerald-100 text-emerald-900", dot: "bg-emerald-700" },
  taking_payment: { pill: "bg-sky-100 text-sky-900", dot: "bg-sky-700" },
  checking_in: { pill: "bg-emerald-100 text-emerald-900", dot: "bg-emerald-700" },
  payment_issue: { pill: "bg-rose-100 text-rose-900", dot: "bg-rose-700" },
  running_late: { pill: "bg-amber-100 text-amber-900", dot: "bg-amber-700" },
  lesson_due: { pill: "bg-amber-100 text-amber-900", dot: "bg-amber-700" },
  busy: { pill: "bg-canvas text-ink", dot: "bg-ink-secondary" },
  free: { pill: "bg-white text-racing-green ring-1 ring-racing-green", dot: "bg-racing-green" },
  clocked_out: { pill: "bg-ink text-white", dot: "bg-white" },
  off: { pill: "bg-canvas text-ink-secondary", dot: "bg-ink-secondary" },
};

const GROUPS: Array<{ label: string; codes: LiveStatusCode[] }> = [
  { label: "With a learner", codes: ["in_lesson", "wrapping_up", "taking_payment", "checking_in"] },
  { label: "Free now", codes: ["free"] },
  { label: "Need a look", codes: ["running_late", "lesson_due", "payment_issue"] },
  { label: "Clocked out", codes: ["clocked_out"] },
];

export default function LiveBoard({ initial, organisationId }: { initial: LiveResponse; organisationId?: string }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.parse(initial.generated_at));

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/organisations/api/live${organisationId ? `?organisation_id=${organisationId}` : ""}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not refresh.");
      setData(body as LiveResponse);
      setNow(Date.parse((body as LiveResponse).generated_at));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not refresh.");
    }
  }, [organisationId]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const counts = useMemo(
    () => GROUPS.map((g) => ({ ...g, count: data.instructors.filter((i) => g.codes.includes(i.status.code)).length })),
    [data]
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counts.map((g) => (
          <div key={g.label} className="rounded-xl border border-border bg-white p-3">
            <p className="text-xs font-semibold text-ink-secondary">{g.label}</p>
            <p className="mt-0.5 font-display text-2xl text-ink">{g.count}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-ink-secondary" role="status">
        {error ? <span className="font-semibold text-rose-800">{error} Showing the last update. </span> : null}
        Updated {time(data.generated_at)} · refreshes every 30 seconds · statuses come from each instructor&rsquo;s app and
        update when their phone syncs.
      </p>

      {data.instructors.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-white p-8 text-center text-sm text-ink-secondary">
          No instructors are linked to your organisation yet.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {data.instructors.map((instructor) => (
            <InstructorCard key={instructor.instructor_id} instructor={instructor} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}

function InstructorCard({ instructor, now }: { instructor: LiveInstructor; now: number }) {
  const { status } = instructor;
  const tone = TONE[status.code];
  const clock = status.clock;
  const freeText = status.free_until
    ? `Free until ${time(status.free_until)}`
    : status.free_from
      ? `Next free ${time(status.free_from)}`
      : status.free_windows.length === 0 && status.working_windows.length
        ? "No free time left today"
        : null;

  return (
    <li className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-ink">{instructor.name}</p>
          <p className="mt-0.5 text-xs text-ink-secondary">
            {clock.state === "in" && clock.first_in_at
              ? `Clocked in ${time(clock.first_in_at)}`
              : clock.state === "out" && clock.last_out_at
                ? `Clocked out ${time(clock.last_out_at)}`
                : "Not clocked in today"}
            {clock.clocked_minutes ? ` · ${hours(clock.clocked_minutes)} on the clock` : ""}
          </p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${tone.pill}`}>
          <span aria-hidden className={`size-1.5 rounded-full ${tone.dot}`} />
          {status.label}
        </span>
      </div>

      {status.detail ? <p className="mt-3 text-sm text-ink">{status.detail}</p> : null}
      {freeText ? <p className="mt-1 text-sm font-semibold text-racing-green">{freeText}</p> : null}

      <DayTimeline instructor={instructor} now={now} />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-secondary">
        <span>
          {instructor.lessons_today.length} lesson{instructor.lessons_today.length === 1 ? "" : "s"} today
        </span>
        {status.free_windows.length ? (
          <span>Free: {status.free_windows.map((w) => `${time(w.from)}–${time(w.to)}`).join(", ")}</span>
        ) : null}
        {instructor.phone ? (
          <a href={`tel:${instructor.phone}`} className="focus-ring inline-flex min-h-11 items-center font-semibold text-racing-green underline">
            Call
          </a>
        ) : null}
      </div>

      {instructor.lessons_today.length ? (
        <details className="group mt-1">
          <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
            Today&rsquo;s lessons
            <span aria-hidden className="ml-1 transition-transform group-open:rotate-180">▾</span>
          </summary>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {instructor.lessons_today.map((lesson) => (
              <li key={lesson.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="text-ink">
                  {time(lesson.starts_at)}–{time(lesson.ends_at)} · {lesson.learner_name}
                </span>
                <span className="text-xs text-ink-secondary">{LESSON_STATUS[lesson.status] ?? lesson.status}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </li>
  );
}

const LESSON_STATUS: Record<string, string> = {
  pending: "Requested",
  confirmed: "Booked",
  in_progress: "In progress",
  completed: "Done",
  no_show: "No-show",
};

/**
 * The working day as a bar: working hours in white, lessons in green, blocked
 * time in grey, now as a line. Gaps of white inside working hours are free.
 */
function DayTimeline({ instructor, now }: { instructor: LiveInstructor; now: number }) {
  const { status } = instructor;
  const points = [
    ...status.working_windows.flatMap((w) => [Date.parse(w.from), Date.parse(w.to)]),
    ...instructor.lessons_today.flatMap((l) => [Date.parse(l.starts_at), Date.parse(l.ends_at)]),
  ];
  if (!points.length) {
    return <p className="mt-3 text-xs text-ink-secondary">No working hours or lessons today.</p>;
  }
  const hour = 3_600_000;
  const start = Math.floor(Math.min(...points, now) / hour) * hour;
  const end = Math.ceil(Math.max(...points, now) / hour) * hour;
  const span = Math.max(end - start, hour);
  const pos = (t: number) => `${((Math.min(Math.max(t, start), end) - start) / span) * 100}%`;
  const width = (a: number, b: number) => `${(Math.max(0, Math.min(b, end) - Math.max(a, start)) / span) * 100}%`;
  const ticks: number[] = [];
  const step = span > 10 * hour ? 3 * hour : 2 * hour;
  // Inner ticks only: a label centred on either edge would hang off the card.
  for (let t = Math.ceil(start / step) * step; t < end; t += step) if (t > start) ticks.push(t);

  const summary = `${instructor.name} today: ${instructor.lessons_today.length} lessons. ${
    status.free_windows.length ? `Free ${status.free_windows.map((w) => `${time(w.from)} to ${time(w.to)}`).join(", ")}.` : "No free time left."
  }`;

  return (
    <div className="mt-4" role="img" aria-label={summary}>
      <div className="relative h-7 overflow-hidden rounded-lg bg-canvas">
        {status.working_windows.map((w) => (
          <span
            key={w.from}
            className="absolute inset-y-0 bg-white ring-1 ring-inset ring-border"
            style={{ left: pos(Date.parse(w.from)), width: width(Date.parse(w.from), Date.parse(w.to)) }}
          />
        ))}
        {instructor.blocks_today.map((b) => (
          <span
            key={b.starts_at}
            title={`${b.label} ${time(b.starts_at)}–${time(b.ends_at)}`}
            className="absolute inset-y-1 rounded bg-[repeating-linear-gradient(135deg,#d6d3dc_0,#d6d3dc_4px,#ebe8ee_4px,#ebe8ee_8px)]"
            style={{ left: pos(Date.parse(b.starts_at)), width: width(Date.parse(b.starts_at), Date.parse(b.ends_at)) }}
          />
        ))}
        {status.clock.state === "out" && status.clock.last_out_at ? (
          <span
            title={`Clocked out ${time(status.clock.last_out_at)}`}
            className="absolute inset-y-0 bg-ink/10"
            style={{ left: pos(Date.parse(status.clock.last_out_at)), right: 0 }}
          />
        ) : null}
        {instructor.lessons_today.map((l) => (
          <span
            key={l.id}
            title={`${l.learner_name} ${time(l.starts_at)}–${time(l.ends_at)}`}
            className={`absolute inset-y-1 rounded ${
              l.status === "pending"
                ? "border border-dashed border-racing-green bg-emerald-50"
                : l.status === "completed" || l.status === "no_show"
                  ? "bg-racing-green/45"
                  : "bg-racing-green"
            }`}
            style={{ left: pos(Date.parse(l.starts_at)), width: width(Date.parse(l.starts_at), Date.parse(l.ends_at)) }}
          />
        ))}
        {now >= start && now <= end ? (
          <span aria-hidden className="absolute inset-y-0 w-0.5 bg-deep-rose" style={{ left: pos(now) }} />
        ) : null}
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-ink-secondary">
        {ticks.map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: pos(t) }}>
            {time(new Date(t).toISOString())}
          </span>
        ))}
      </div>
    </div>
  );
}
