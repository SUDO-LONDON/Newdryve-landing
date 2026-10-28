/**
 * A school giving its instructors sick days (Newdryve ADR-058).
 *
 * An instructor calls in sick in the app for today and the next 2 days. Their
 * school can mark them off sick for any London day from today, with no limit
 * on how far ahead: the day closes to bookings, its lessons are cancelled free,
 * each learner is told and so is the instructor. A school removes only the
 * days it gave; a day the instructor called in is theirs to reopen.
 * Client-safe: no server imports.
 */

import { addDays, day as dayLabel, londonToday } from "@/lib/organisations/format";

export interface SickDay {
  date: string;
  created_at: string;
  cancelled_count: number;
  recorded_by_organisation: { id: string; name: string } | null;
  /** True for a day this school gave, which it can remove. */
  removable: boolean;
}

export interface SickDayLesson {
  booking_id: string;
  starts_at: string;
  ends_at?: string;
  learner_name: string;
}

export interface SickDayPreview {
  date: string;
  allowed: boolean;
  reason?: "date_out_of_range" | "already_sick" | string;
  lessons: SickDayLesson[];
  started: SickDayLesson[];
}

export interface GiveSickDayResult {
  sick_day: { date: string; created_at: string; recorded_by_organisation: { id: string; name: string } | null };
  cancelled: SickDayLesson[];
  started: SickDayLesson[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar date written YYYY-MM-DD. Never put anything else in an API path. */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** The first day the picker offers: London today. There is no last day. */
export function earliestSickDay(): string {
  return londonToday();
}

/** The portal's own endpoint for one member's sick days, scoped to the school. */
export function sickDaysEndpoint(instructorId: string, organisationId: string, suffix = ""): string {
  return `/organisations/api/members/${encodeURIComponent(instructorId)}/sick-days${suffix}?organisation_id=${encodeURIComponent(organisationId)}`;
}

/** "Given by your school" or "Called in by Sam", for the list. */
export function recordedByLabel(sickDay: Pick<SickDay, "removable" | "recorded_by_organisation">, instructorName: string): string {
  if (sickDay.removable) return "Given by your school";
  if (sickDay.recorded_by_organisation) return `Given by ${sickDay.recorded_by_organisation.name}`;
  return `Called in by ${instructorName}`;
}

/** "Mon 2 Nov", "Today" or "Tomorrow". */
export function sickDayLabel(date: string, today = londonToday()): string {
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  return dayLabel(date);
}

const lessons = (n: number) => `${n} lesson${n === 1 ? "" : "s"}`;

/** What the preview says before the school confirms. */
export function previewSummary(preview: SickDayPreview, instructorName: string): string {
  if (!preview.allowed) {
    if (preview.reason === "already_sick") return `${instructorName} is already off sick that day.`;
    if (preview.reason === "date_out_of_range") return "Choose today or a later day.";
    return "That day can't be given as a sick day.";
  }
  const kept = preview.started.length ? ` ${lessons(preview.started.length)} already started will be left as they are.` : "";
  if (!preview.lessons.length) return `${instructorName} has no lessons booked that day. The day will close to new bookings.${kept}`;
  return `${lessons(preview.lessons.length)} will be cancelled, free for the learners, who are told straight away. The day closes to new bookings.${kept}`;
}

/** The confirmation line after a sick day is given. */
export function resultMessage(result: GiveSickDayResult, instructorName: string, created: boolean): string {
  const when = sickDayLabel(result.sick_day.date);
  if (!created) return `${instructorName} was already off sick ${when === "Today" || when === "Tomorrow" ? when.toLowerCase() : `on ${when}`}. Nothing changed.`;
  const cancelled = result.cancelled.length
    ? ` ${lessons(result.cancelled.length)} cancelled and the learners told.`
    : " No lessons were booked.";
  return `${instructorName} is off sick ${when === "Today" || when === "Tomorrow" ? when.toLowerCase() : `on ${when}`}.${cancelled} We've let ${instructorName} know.`;
}
