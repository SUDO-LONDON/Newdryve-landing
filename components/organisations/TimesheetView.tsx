"use client";

import Link from "next/link";
import type { TimesheetInstructor, TimesheetResponse } from "@/lib/organisations/types";
import { addDays, day, gbp, hours, mondayOf, londonToday, time } from "@/lib/organisations/format";

/**
 * Hours per instructor per day for one week. "Taught" is completed lessons at
 * their booked length; "clocked" is clock-in to clock-out from the app.
 */
export default function TimesheetView({ data }: { data: TimesheetResponse }) {
  const week = data.week_start;
  const thisWeek = mondayOf(londonToday());
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const sum = (key: keyof TimesheetInstructor["totals"]) => data.instructors.reduce((n, i) => n + i.totals[key], 0);

  function downloadCsv() {
    const header = ["Instructor", ...days.map((d) => `${day(d)} taught (h)`), "Taught (h)", "Lessons", "Clocked (h)", "No-shows", "Cancelled by instructor", "Cancelled by learner", "Takings (£)"];
    const rows = data.instructors.map((i) => [
      i.name,
      ...i.days.map((d) => (d.lesson_minutes / 60).toFixed(2)),
      (i.totals.lesson_minutes / 60).toFixed(2),
      String(i.totals.lessons),
      (i.totals.clocked_minutes / 60).toFixed(2),
      String(i.totals.no_shows),
      String(i.totals.cancelled_by_instructor),
      String(i.totals.cancelled_by_learner),
      (i.totals.revenue_pence / 100).toFixed(2),
    ]);
    // Quote every cell and neutralise spreadsheet formulas in names.
    const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet-${week}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link href={`/organisations/timesheets?week=${addDays(week, -7)}`} className="focus-ring inline-flex min-h-11 items-center rounded-lg border border-border bg-white px-3 text-sm font-semibold text-ink" aria-label="Previous week">
            ←
          </Link>
          <p className="min-w-[11rem] px-2 text-center text-sm font-bold text-ink">
            {day(week)} – {day(addDays(week, 6))}
          </p>
          <Link
            href={`/organisations/timesheets?week=${addDays(week, 7)}`}
            aria-disabled={week >= thisWeek}
            className={`focus-ring inline-flex min-h-11 items-center rounded-lg border border-border bg-white px-3 text-sm font-semibold text-ink ${week >= thisWeek ? "pointer-events-none opacity-40" : ""}`}
            aria-label="Next week"
          >
            →
          </Link>
          {week !== thisWeek ? (
            <Link href="/organisations/timesheets" className="focus-ring ml-1 inline-flex min-h-11 items-center px-2 text-sm font-semibold text-racing-green underline">
              This week
            </Link>
          ) : null}
        </div>
        <button type="button" onClick={downloadCsv} className="focus-ring inline-flex min-h-11 items-center rounded-lg border border-border bg-white px-4 text-sm font-semibold text-ink hover:bg-blush-surface">
          Download CSV
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Taught" value={hours(sum("lesson_minutes"))} />
        <Stat label="Lessons" value={String(sum("lessons"))} />
        <Stat label="Clocked" value={hours(sum("clocked_minutes"))} />
        <Stat label="Takings" value={gbp(sum("revenue_pence"))} />
      </div>

      {data.instructors.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-white p-8 text-center text-sm text-ink-secondary">No instructors are linked yet.</p>
      ) : (
        <>
          {/* Phones: one card per instructor. */}
          <ul className="mt-4 space-y-3 md:hidden">
            {data.instructors.map((i) => (
              <li key={i.instructor_id} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-bold text-ink">{i.name}</p>
                  <p className="text-sm font-bold text-ink">{hours(i.totals.lesson_minutes)}</p>
                </div>
                <p className="mt-0.5 text-xs text-ink-secondary">
                  {i.totals.lessons} lessons · {hours(i.totals.clocked_minutes)} clocked · {gbp(i.totals.revenue_pence)}
                  {i.totals.no_shows ? ` · ${i.totals.no_shows} no-show` : ""}
                  {i.totals.cancelled_by_instructor ? ` · ${i.totals.cancelled_by_instructor} cancelled by them` : ""}
                </p>
                <dl className="mt-3 grid grid-cols-7 gap-1 text-center">
                  {i.days.map((d) => (
                    <div key={d.date} className={`rounded-lg py-1.5 ${d.lesson_minutes ? "bg-emerald-50" : "bg-canvas"}`}>
                      <dt className="text-[11px] font-semibold text-ink-secondary">{day(d.date).slice(0, 2)}</dt>
                      <dd className="text-xs font-bold text-ink">{d.lesson_minutes ? hours(d.lesson_minutes).replace(/ /g, "") : "–"}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>

          {/* Wider screens: the sheet. */}
          <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-border bg-white md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-blush-surface/60 text-[11px] uppercase tracking-wider text-ink-secondary">
                <tr>
                  <th scope="col" className="sticky left-0 bg-blush-surface px-3 py-3">Instructor</th>
                  {days.map((d) => (
                    <th key={d} scope="col" className="px-2 py-3 text-right">{day(d)}</th>
                  ))}
                  <th scope="col" className="px-3 py-3 text-right">Taught</th>
                  <th scope="col" className="px-3 py-3 text-right">Clocked</th>
                  <th scope="col" className="px-3 py-3 text-right">Takings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.instructors.map((i) => (
                  <tr key={i.instructor_id}>
                    <th scope="row" className="sticky left-0 bg-white px-3 py-3 font-semibold text-ink">
                      {i.name}
                      <span className="block text-xs font-normal text-ink-secondary">
                        {i.totals.lessons} lessons
                        {i.totals.no_shows ? ` · ${i.totals.no_shows} no-show` : ""}
                        {i.totals.cancelled_by_instructor ? ` · ${i.totals.cancelled_by_instructor} cancelled by them` : ""}
                      </span>
                    </th>
                    {i.days.map((d) => (
                      <td key={d.date} className="px-2 py-3 text-right align-top">
                        <span className={d.lesson_minutes ? "font-semibold text-ink" : "text-ink-secondary"}>{d.lesson_minutes ? hours(d.lesson_minutes) : "–"}</span>
                        {d.clocked_minutes ? (
                          <span className="block text-[11px] text-ink-secondary" title={`${time(d.first_in_at)}–${time(d.last_out_at)}`}>
                            {hours(d.clocked_minutes)} clocked
                          </span>
                        ) : null}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right font-bold text-ink">{hours(i.totals.lesson_minutes)}</td>
                    <td className="px-3 py-3 text-right text-ink">{hours(i.totals.clocked_minutes)}</td>
                    <td className="px-3 py-3 text-right text-ink">{gbp(i.totals.revenue_pence)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-border font-bold">
                <tr>
                  <th scope="row" className="sticky left-0 bg-white px-3 py-3">All instructors</th>
                  {days.map((d, index) => (
                    <td key={d} className="px-2 py-3 text-right">
                      {hours(data.instructors.reduce((n, i) => n + (i.days[index]?.lesson_minutes ?? 0), 0))}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right">{hours(sum("lesson_minutes"))}</td>
                  <td className="px-3 py-3 text-right">{hours(sum("clocked_minutes"))}</td>
                  <td className="px-3 py-3 text-right">{gbp(sum("revenue_pence"))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
      <p className="mt-3 text-xs text-ink-secondary">
        Taught counts completed lessons at their booked length. Clocked is from the instructor clocking in and out in the app.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <p className="text-xs font-semibold text-ink-secondary">{label}</p>
      <p className="mt-0.5 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}
