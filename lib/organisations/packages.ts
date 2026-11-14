/**
 * A school's packages (Newdryve `docs/contracts/school-packages.md`, ADR-074).
 * The school sells packages of lesson hours and takes the money itself; the
 * office says which one a caller paid for when it books them from WhatsApp,
 * and the lessons then come out of those hours with no card. This is the
 * school's own list of what it sells, and its learners' hours. Client-safe.
 *
 *   GET   /v1/organisations/me/packages                 the list, on sale or not
 *   POST  /v1/organisations/me/packages                 { organisation_id?, category, name, minutes, ... }
 *   PATCH /v1/organisations/me/packages/:id             { organisation_id?, ...fields }
 *   GET   /v1/organisations/me/learner-packages         each learner's hours
 *   PATCH /v1/organisations/me/learner-packages/:id     { minutes_adjusted?, adjust_note?, voided?, void_reason? }
 */

import { parsePounds, pounds } from "@/lib/organisations/promotions";

export const PACKAGE_CATEGORIES = [
  { value: "weekly_manual", label: "Weekly manual" },
  { value: "weekly_automatic", label: "Weekly automatic" },
  { value: "intensive", label: "Intensive course" },
  { value: "towing", label: "Towing" },
  { value: "other", label: "Other" },
] as const;
export type PackageCategory = (typeof PACKAGE_CATEGORIES)[number]["value"];

export const LESSON_TIMES = [
  { value: "weekday_daytime", label: "Weekday daytimes" },
  { value: "weekday_evening", label: "Weekday evenings" },
  { value: "weekend", label: "Weekends" },
] as const;
export type LessonTime = (typeof LESSON_TIMES)[number]["value"];

export type Transmission = "manual" | "auto";

export interface SchoolPackage {
  id: string;
  category: PackageCategory;
  category_label: string;
  name: string;
  minutes: number;
  hours_label: string;
  transmission: Transmission | null;
  lesson_times: LessonTime[];
  lesson_times_label: string | null;
  /** What the school charges: its own record. Newdryve never charges it and learners never see it. */
  price_pence: number | null;
  valid_months: number;
  is_active: boolean;
  sort_order: number;
}

export interface PackagesResponse {
  organisation_id: string;
  packages: SchoolPackage[];
}

export type LearnerHoursState = "active" | "used_up" | "expired" | "voided";

/** One package a learner bought, with what is left of it. */
export interface LearnerHours {
  id: string;
  name: string;
  category_label: string;
  /** The account's name once the learner has confirmed a lesson; until then the name the office typed. */
  learner_name: string | null;
  learner_phone_e164: string | null;
  has_account: boolean;
  minutes_total: number;
  minutes_used: number;
  minutes_booked: number;
  minutes_left: number;
  hours_total_label: string;
  hours_left_label: string;
  /** The school's correction in minutes: below zero for hours used before the learner was added. */
  minutes_adjusted: number;
  adjust_note: string | null;
  expires_at: string;
  state: LearnerHoursState;
  created_at: string;
}

export interface LearnerHoursResponse {
  organisation_id: string;
  items: LearnerHours[];
}

/** What the API takes to add a package (`createPackageSchema`). */
export interface PackageInput {
  category: PackageCategory;
  name: string;
  minutes: number;
  transmission: Transmission | null;
  lesson_times: LessonTime[];
  price_pence: number | null;
  valid_months: number;
}

/** The form's values as typed. */
export interface PackageDraft {
  category: PackageCategory;
  name: string;
  hours: string;
  transmission: "" | Transmission;
  lesson_times: LessonTime[];
  price: string;
  valid_months: string;
}

export const PACKAGE_NAME_MAX = 60;
export const PACKAGE_MAX_HOURS = 1000;
export const PACKAGE_MAX_MONTHS = 60;

export function emptyPackageDraft(): PackageDraft {
  return { category: "weekly_manual", name: "", hours: "", transmission: "", lesson_times: [], price: "", valid_months: "12" };
}

/** "10", "4.5", "1.25": hours as a school types them. */
export function hoursText(minutes: number): string {
  return String(Math.round((minutes / 60) * 100) / 100);
}

/** "10", "4.5" or "4½" to minutes; null for anything that is not a whole number of minutes. */
export function minutesFromHours(text: string): number | null {
  const clean = text.trim().replace("½", ".5").replace(/\s*(hours?|hrs?|h)$/i, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(clean)) return null;
  const minutes = Number(clean) * 60;
  return Number.isInteger(Math.round(minutes * 100) / 100) ? Math.round(minutes) : null;
}

export function draftFromPackage(p: SchoolPackage): PackageDraft {
  return {
    category: p.category,
    name: p.name,
    hours: hoursText(p.minutes),
    transmission: p.transmission ?? "",
    lesson_times: [...p.lesson_times],
    price: p.price_pence === null ? "" : pounds(p.price_pence),
    valid_months: String(p.valid_months),
  };
}

export type PackageCheck = { ok: true; input: PackageInput } | { ok: false; error: string };

/**
 * The form's values checked the way the API checks them (`packageFields`:
 * name 1 to 60, 30 minutes to 1,000 hours, 1 to 60 months), so a bad value is
 * caught before the round trip.
 */
export function packageInputFromDraft(draft: PackageDraft): PackageCheck {
  const name = draft.name.trim();
  if (!name) return { ok: false, error: "Give the package a name, as your office would say it." };
  if (name.length > PACKAGE_NAME_MAX) return { ok: false, error: `Keep the name to ${PACKAGE_NAME_MAX} characters.` };
  const minutes = minutesFromHours(draft.hours);
  if (minutes === null || minutes < 30 || minutes > PACKAGE_MAX_HOURS * 60) {
    return { ok: false, error: `Say how many hours it is, from half an hour to ${PACKAGE_MAX_HOURS}. For example 10 or 4.5.` };
  }
  let price: number | null = null;
  if (draft.price.trim()) {
    price = parsePounds(draft.price);
    if (price === null || price > 100_000_000) return { ok: false, error: "Type the price in pounds, for example 430. Leave it empty if you would rather not record it." };
  }
  const months = draft.valid_months.trim() === "" ? NaN : Number(draft.valid_months.trim());
  if (!Number.isInteger(months) || months < 1 || months > PACKAGE_MAX_MONTHS) {
    return { ok: false, error: `Say how many months the hours last, from 1 to ${PACKAGE_MAX_MONTHS}.` };
  }
  return {
    ok: true,
    input: {
      category: draft.category,
      name,
      minutes,
      transmission: draft.transmission || null,
      // In a fixed order, so the same ticks always make the same list.
      lesson_times: LESSON_TIMES.map((t) => t.value).filter((t) => draft.lesson_times.includes(t)),
      price_pence: price,
      valid_months: months,
    },
  };
}

/** Only what changed, for PATCH: the API answers 422 "Nothing to change" to an empty patch. */
export function packagePatch(current: SchoolPackage, input: PackageInput): Partial<PackageInput> {
  const patch: Partial<PackageInput> = {};
  if (input.category !== current.category) patch.category = input.category;
  if (input.name !== current.name) patch.name = input.name;
  if (input.minutes !== current.minutes) patch.minutes = input.minutes;
  if (input.transmission !== current.transmission) patch.transmission = input.transmission;
  if (input.lesson_times.join(",") !== current.lesson_times.join(",")) patch.lesson_times = input.lesson_times;
  if (input.price_pence !== current.price_pence) patch.price_pence = input.price_pence;
  if (input.valid_months !== current.valid_months) patch.valid_months = input.valid_months;
  return patch;
}

/** "10 hours · manual · weekday daytimes · lasts 12 months". */
export function describePackage(p: Pick<SchoolPackage, "hours_label" | "transmission" | "lesson_times_label" | "valid_months">): string {
  return [
    p.hours_label,
    p.transmission === "auto" ? "automatic" : p.transmission === "manual" ? "manual" : "any car",
    p.lesson_times_label ?? "any time",
    `lasts ${p.valid_months} month${p.valid_months === 1 ? "" : "s"}`,
  ].join(" · ");
}

/** The school's list by kind, in the order the chat asks about them; empty kinds left out. */
export function packagesByCategory(packages: SchoolPackage[]): Array<{ category: PackageCategory; label: string; packages: SchoolPackage[] }> {
  return PACKAGE_CATEGORIES
    .map((c) => ({ category: c.value, label: c.label, packages: packages.filter((p) => p.category === c.value) }))
    .filter((group) => group.packages.length > 0);
}

export const HOURS_STATE_LABEL: Record<LearnerHoursState, string> = {
  active: "In use",
  used_up: "All used",
  expired: "Run out",
  voided: "Cancelled",
};

export type AdjustmentCheck = { ok: true; minutes: number } | { ok: false; error: string };

/**
 * A correction typed in hours: "-4" for four hours the learner had already
 * used before they were added, "1" for an hour given back. It replaces any
 * earlier correction; it is not added to it.
 */
export function adjustmentFromText(text: string): AdjustmentCheck {
  const clean = text.trim().replace(/^\+/, "");
  if (clean === "") return { ok: true, minutes: 0 };
  const minutes = minutesFromHours(clean);
  if (minutes === null || Math.abs(minutes) > PACKAGE_MAX_HOURS * 60) {
    return { ok: false, error: "Type the correction in hours, for example -4 for four hours already used, or 1 for an hour given back." };
  }
  return { ok: true, minutes };
}
