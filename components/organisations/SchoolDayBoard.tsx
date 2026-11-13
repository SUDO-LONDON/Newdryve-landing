"use client";

import { time } from "@/lib/organisations/format";
import { londonMinutes, milesText, type DayItem, type DeskCandidate, type SchoolDay } from "@/lib/organisations/requests";

/**
 * Every instructor's day on one shared time axis, one row each: working hours
 * in white, lessons in green, requests dashed, a request the school is still
 * deciding in pink, blocked and personal time striped, private lessons grey,
 * sick days rose. With `highlight`, the requested time is a pink band across
 * every row; with `candidates`, rows can be chosen and say who is free.
 */
export default function SchoolDayBoard({
  day,
  highlight,
  candidates,
  selectedId,
  onSelect,
}: {
  day: SchoolDay;
  highlight?: { starts_at: string; ends_at: string } | null;
  candidates?: DeskCandidate[];
  selectedId?: string | null;
  onSelect?: (instructorId: string) => void;
}) {
  const byId = new Map((candidates ?? []).map((c) => [c.instructor_id, c]));
  const points: number[] = [];
  for (const row of day.instructors) {
    for (const w of row.working_hours) points.push(londonMinutes(w.start), londonMinutes(w.end));
    for (const item of row.items) {
      if (item.kind === "sick") continue;
      points.push(londonMinutes(item.starts_at), endMinutes(item));
    }
  }
  if (highlight) points.push(londonMinutes(highlight.starts_at), londonMinutes(highlight.ends_at));
  const start = Math.min(7 * 60, ...points.map((p) => Math.floor(p / 60) * 60));
  const end = Math.max(19 * 60, ...points.map((p) => Math.ceil(p / 60) * 60));
  const span = Math.max(end - start, 60);
  const pos = (m: number) => `${((Math.min(Math.max(m, start), end) - start) / span) * 100}%`;
  const width = (a: number, b: number) => `${(Math.max(0, Math.min(b, end) - Math.max(a, start)) / span) * 100}%`;
  const ticks: number[] = [];
  for (let t = start + 60; t < end; t += 60) ticks.push(t);

  if (!day.instructors.length) {
    return <p className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-ink-secondary">No instructors yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white">
      <div className="min-w-[720px]">
        <div className="flex border-b border-border bg-canvas/60 text-[11px] text-ink-secondary">
          <div className="w-44 shrink-0 px-3 py-2 font-semibold">Instructor</div>
          <div className="relative h-8 flex-1">
            {ticks.map((t) => (
              <span key={t} className="absolute top-2 -translate-x-1/2" style={{ left: pos(t) }}>
                {String(Math.floor(t / 60)).padStart(2, "0")}:00
              </span>
            ))}
          </div>
        </div>
        <ul>
          {day.instructors.map((row) => {
            const candidate = byId.get(row.instructor_id);
            const selected = selectedId === row.instructor_id;
            const selectable = Boolean(onSelect && candidate?.available);
            const label = candidate
              ? candidate.available
                ? `Free${milesText(candidate.miles) ? `, ${milesText(candidate.miles)} away` : ""}`
                : candidate.unavailable_reason === "no_lesson_type"
                  ? "Doesn't teach this lesson"
                  : "Busy then"
              : null;
            return (
              <li key={row.instructor_id} className={`flex border-b border-border last:border-b-0 ${selected ? "bg-emerald-50" : ""}`}>
                <div className="w-44 shrink-0 px-3 py-2">
                  {selectable ? (
                    <button
                      type="button"
                      onClick={() => onSelect!(row.instructor_id)}
                      aria-pressed={selected}
                      className="focus-ring w-full rounded-lg text-left"
                    >
                      <span className="block truncate text-sm font-semibold text-ink">{row.name}</span>
                      <span className="block text-[11px] text-racing-green">{selected ? "Chosen" : label}</span>
                    </button>
                  ) : (
                    <>
                      <span className="block truncate text-sm font-semibold text-ink">{row.name}</span>
                      {label ? <span className="block text-[11px] text-ink-secondary">{label}</span> : null}
                    </>
                  )}
                </div>
                <div className="relative my-2 mr-3 h-9 flex-1 overflow-hidden rounded-lg bg-canvas">
                  {row.working_hours.map((w) => (
                    <span
                      key={`${w.start}-${w.end}`}
                      className="absolute inset-y-0 bg-white ring-1 ring-inset ring-border"
                      style={{ left: pos(londonMinutes(w.start)), width: width(londonMinutes(w.start), londonMinutes(w.end)) }}
                    />
                  ))}
                  {highlight ? (
                    <span
                      aria-hidden
                      className="absolute inset-y-0 bg-deep-rose/15 ring-1 ring-inset ring-deep-rose/40"
                      style={{
                        left: pos(londonMinutes(highlight.starts_at)),
                        width: width(londonMinutes(highlight.starts_at), londonMinutes(highlight.ends_at)),
                      }}
                    />
                  ) : null}
                  {row.items.map((item, index) => (
                    <span
                      key={`${item.kind}-${item.id ?? index}-${item.starts_at}`}
                      title={`${item.title} ${item.kind === "sick" ? "" : `${time(item.starts_at)}–${time(item.ends_at)}`}${item.pickup_label ? `, ${item.pickup_label}` : ""}`}
                      className={`absolute inset-y-1 overflow-hidden truncate rounded px-1 text-[10px] leading-7 ${itemClass(item)}`}
                      style={
                        item.kind === "sick"
                          ? { left: 0, right: 0 }
                          : { left: pos(londonMinutes(item.starts_at)), width: width(londonMinutes(item.starts_at), endMinutes(item)) }
                      }
                    >
                      {item.kind === "lesson" || item.kind === "request" || item.kind === "sick" ? item.title : ""}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
        <Legend />
      </div>
    </div>
  );
}

/** An item that runs past midnight ends at the axis's end. */
function endMinutes(item: DayItem): number {
  const end = londonMinutes(item.ends_at);
  return end <= londonMinutes(item.starts_at) ? 24 * 60 : end;
}

function itemClass(item: DayItem): string {
  if (item.kind === "request" && item.held_by_school) return "border border-dashed border-deep-rose bg-rose-50 text-deep-rose-ink";
  if (item.kind === "request") return "border border-dashed border-racing-green bg-emerald-50 text-racing-green";
  if (item.kind === "lesson") {
    return item.status === "completed" || item.status === "no_show" ? "bg-racing-green/45 text-white" : "bg-racing-green text-white";
  }
  if (item.kind === "private") return "bg-ink/25";
  if (item.kind === "sick") return "bg-rose-100 text-rose-800";
  if (item.kind === "routine") return "bg-amber-100";
  return "bg-[repeating-linear-gradient(135deg,#d6d3dc_0,#d6d3dc_4px,#ebe8ee_4px,#ebe8ee_8px)]";
}

function Legend() {
  const keys: Array<[string, string]> = [
    ["bg-white ring-1 ring-inset ring-border", "Working hours"],
    ["bg-racing-green", "Lesson"],
    ["border border-dashed border-racing-green bg-emerald-50", "Waiting for the instructor"],
    ["border border-dashed border-deep-rose bg-rose-50", "Waiting for you"],
    ["bg-ink/25", "Their private lesson"],
    ["bg-[repeating-linear-gradient(135deg,#d6d3dc_0,#d6d3dc_4px,#ebe8ee_4px,#ebe8ee_8px)]", "Blocked"],
    ["bg-amber-100", "Routine"],
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-3 py-2 text-[11px] text-ink-secondary">
      {keys.map(([cls, label]) => (
        <li key={label} className="flex items-center gap-1.5">
          <span aria-hidden className={`inline-block h-3 w-5 rounded ${cls}`} />
          {label}
        </li>
      ))}
    </ul>
  );
}
