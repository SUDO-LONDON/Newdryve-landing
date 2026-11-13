/**
 * The school's request desk (Newdryve ADR-073): requests a school decides
 * itself, the members it could give one to, and every member's day.
 * Client-safe types and helpers; the API is the Newdryve backend's
 * /v1/organisations/me/requests and /calendar.
 */

export type RequestRouting = "instructor" | "school";
export type DeskDecision = "book" | "send" | "decline";
export type DeskWarning = "manual_only" | "automatic_only" | "outside_area" | "language";

export interface RequestSummary {
  id: string;
  organisation: { id: string; name: string | null } | null;
  learner: { name: string };
  lesson: { code: string; label: string; duration_minutes: number } | null;
  starts_at: string;
  ends_at: string;
  pickup_label: string | null;
  price_pence: number;
  status: string;
  waiting: boolean;
  expires_at: string;
  expired: boolean;
  requested_at: string;
  held_at: string | null;
  learner_chose: boolean;
  instructor: { id: string; name: string };
  passed_instructors: Array<{ id: string; name: string }>;
  preferences: {
    transmission: string | null;
    language: string | null;
    gender_preference: string | null;
    test_centre: string | null;
  };
  decision: "booked" | "sent" | "declined" | null;
  decided_at: string | null;
  decided_by: string | null;
}

export interface RequestsResponse {
  generated_at: string;
  organisations: Array<{ id: string; name: string; request_routing: RequestRouting }>;
  waiting: RequestSummary[];
  decided: RequestSummary[];
}

export interface DeskCandidate {
  instructor_id: string;
  name: string;
  available: boolean;
  unavailable_reason: "busy" | "no_lesson_type" | null;
  warnings: DeskWarning[];
  recommended: boolean;
  current: boolean;
  learner_chose: boolean;
  miles: number | null;
  distance_from: { kind: "previous_lesson" | "test_centre"; label: string | null; at: string | null } | null;
  previous_lesson: { ends_at: string; label: string | null } | null;
  next_lesson: { starts_at: string; label: string | null; miles_from_pickup: number | null } | null;
  lessons_that_day: number;
  price_pence: number | null;
}

export type DayItemKind = "lesson" | "request" | "private" | "block" | "event" | "routine" | "sick";

export interface DayItem {
  kind: DayItemKind;
  id: string | null;
  starts_at: string;
  ends_at: string;
  title: string;
  status?: string | null;
  pickup_label?: string | null;
  held_by_school?: boolean;
}

export interface SchoolDay {
  date: string;
  organisation: { id: string; name: string | null };
  instructors: Array<{
    instructor_id: string;
    name: string;
    working_hours: Array<{ start: string; end: string }>;
    items: DayItem[];
  }>;
}

export interface RequestDetailResponse {
  request: RequestSummary;
  candidates: DeskCandidate[];
  day: SchoolDay;
}

const WARNING_TEXT: Record<DeskWarning, string> = {
  manual_only: "Manual car only",
  automatic_only: "Automatic car only",
  outside_area: "Outside their area",
  language: "Doesn't list the learner's language",
};

export function warningText(warning: DeskWarning): string {
  return WARNING_TEXT[warning] ?? warning;
}

/** "0.5 miles", "12 miles", or null without a distance. */
export function milesText(miles: number | null | undefined): string | null {
  if (miles == null || !Number.isFinite(miles)) return null;
  if (miles < 0.1) return "next door";
  const value = miles < 10 ? miles.toFixed(1).replace(/\.0$/, "") : String(Math.round(miles));
  return `${value} ${value === "1" ? "mile" : "miles"}`;
}

/** Minutes after London midnight for an instant, or for "HH:MM". */
export function londonMinutes(value: string): number {
  if (/^\d{2}:\d{2}/.test(value)) {
    const [h, m] = value.split(":").map(Number);
    return h! * 60 + m!;
  }
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

/** The decision, in the school's words, for the list of decided requests. */
export function decisionText(summary: Pick<RequestSummary, "decision" | "instructor" | "status">): string {
  if (summary.decision === "booked") return `Booked with ${summary.instructor.name}`;
  if (summary.decision === "sent") {
    if (summary.status === "confirmed") return `${summary.instructor.name} accepted`;
    if (summary.status === "pending") return `Sent to ${summary.instructor.name}`;
    return `Sent to ${summary.instructor.name}`;
  }
  if (summary.decision === "declined") return "Declined";
  return "";
}
