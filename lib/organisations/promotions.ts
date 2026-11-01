/**
 * A school's promotions (Newdryve `docs/contracts/organisations.md`,
 * "Promotions"). The one kind is an intro rate: a learner's first `hours`
 * hours of lessons booked through the school cost `price_per_hour_pence` an
 * hour. A school has at most one active intro rate; ending one is
 * `active: false`. Nothing is deleted, so a booking keeps the promotion that
 * priced it. The discount comes off the instructor's price and a lead-percent
 * fee follows it; Newdryve never funds it. Client-safe.
 *
 *   GET   /v1/organisations/me/promotions?organisation_id=
 *   POST  /v1/organisations/me/promotions        { organisation_id?, kind, title, ... }
 *   PATCH /v1/organisations/me/promotions/:id    { organisation_id?, ...fields }
 *   GET/POST /v1/ops/organisations/:id/promotions, PATCH …/:promotionId (ops, strict body)
 */

import { gbp, londonDateOf, londonToday, shortDate } from "@/lib/organisations/format";

export type PromotionKind = "intro_rate";

export interface Promotion {
  id: string;
  organisation_id: string;
  kind: PromotionKind;
  title: string;
  description: string | null;
  hours: number;
  price_per_hour_pence: number;
  active: boolean;
  starts_at: string | null;
  /** The instant the offer stops; null for no end. */
  ends_at: string | null;
  /** Active, started and not yet ended: learners get the rate right now. */
  live: boolean;
  updated_by: "newdryve" | "school";
  /** Ops sees every email; the school only its own admins'. */
  updated_by_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromotionsResponse {
  organisation_id: string;
  promotions: Promotion[];
}

/** What the API takes to start an offer (`createPromotionSchema`). */
export interface PromotionInput {
  kind: "intro_rate";
  title: string;
  description: string | null;
  hours: number;
  price_per_hour_pence: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

/** The form's values as typed: hours and pounds as text, dates as London days (YYYY-MM-DD) or empty. */
export interface PromotionDraft {
  title: string;
  description: string;
  hours: string;
  price_per_hour: string;
  starts_on: string;
  /** The last day the offer is on, inclusive. */
  ends_on: string;
}

export const PROMOTION_TITLE_MAX = 80;
export const PROMOTION_DESCRIPTION_MAX = 500;
export const PROMOTION_MAX_HOURS = 100;
export const PROMOTION_MAX_PRICE_PENCE = 100_000;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function emptyDraft(): PromotionDraft {
  return { title: "Intro offer", description: "", hours: "", price_per_hour: "", starts_on: "", ends_on: "" };
}

/** "36" or "36.50": pence only when there are some. */
export function pounds(pence: number): string {
  return (pence / 100).toFixed(pence % 100 === 0 ? 0 : 2);
}

/** "£36" or "£36.50". */
export function hourly(pence: number): string {
  const text = gbp(pence);
  return text.endsWith(".00") ? text.slice(0, -3) : text;
}

/** "36", "36.50", "£36" or "1,000" to pence; null for anything else. */
export function parsePounds(text: string): number | null {
  const clean = text.trim().replace(/^£/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

/** The London calendar day an offer's last instant falls on. */
function lastDayOf(endsAt: string): string {
  return londonDateOf(new Date(Date.parse(endsAt) - 1).toISOString());
}

export function draftFromPromotion(p: Promotion): PromotionDraft {
  return {
    title: p.title,
    description: p.description ?? "",
    hours: String(p.hours),
    price_per_hour: pounds(p.price_per_hour_pence),
    starts_on: p.starts_at ? londonDateOf(p.starts_at) : "",
    ends_on: p.ends_at ? lastDayOf(p.ends_at) : "",
  };
}

function londonOffsetMinutes(atUtcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(atUtcMs));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
  return Math.round((wall - atUtcMs) / 60_000);
}

/**
 * The instant a London calendar day begins, `dayOffset` days on. "2026-07-01"
 * is 2026-06-30T23:00Z (BST); "2026-11-30" is 2026-11-30T00:00Z (GMT).
 */
export function londonMidnightIso(date: string, dayOffset = 0): string {
  const [y, m, d] = date.split("-").map(Number);
  const naive = Date.UTC(y!, m! - 1, d! + dayOffset);
  // The offset read at the naive instant is right except within an hour of a
  // clock change; reading it again at the corrected instant settles that.
  let instant = naive - londonOffsetMinutes(naive) * 60_000;
  instant = naive - londonOffsetMinutes(instant) * 60_000;
  return new Date(instant).toISOString();
}

export type DraftCheck = { ok: true; input: PromotionInput } | { ok: false; error: string };

/**
 * The form's values checked the way the API checks them (`promotionFields`:
 * title 1–80, hours 1–100, price 1p–£1,000, the end after the start), so a
 * bad value is caught before the round trip. Dates are London days: the offer
 * starts at the start of `starts_on` and stops at the end of `ends_on`.
 */
export function promotionInputFromDraft(draft: PromotionDraft, today = londonToday()): DraftCheck {
  const title = draft.title.trim();
  if (!title) return { ok: false, error: "Give the offer a title." };
  if (title.length > PROMOTION_TITLE_MAX) return { ok: false, error: `Keep the title to ${PROMOTION_TITLE_MAX} characters.` };
  const description = draft.description.trim();
  if (description.length > PROMOTION_DESCRIPTION_MAX) {
    return { ok: false, error: `Keep the description to ${PROMOTION_DESCRIPTION_MAX} characters.` };
  }
  const hours = draft.hours.trim() === "" ? NaN : Number(draft.hours.trim());
  if (!Number.isInteger(hours) || hours < 1 || hours > PROMOTION_MAX_HOURS) {
    return { ok: false, error: `Cover a whole number of hours, from 1 to ${PROMOTION_MAX_HOURS}.` };
  }
  const pence = parsePounds(draft.price_per_hour);
  if (pence === null || pence < 1 || pence > PROMOTION_MAX_PRICE_PENCE) {
    return { ok: false, error: "Set an hourly price between £0.01 and £1,000." };
  }
  const startsOn = draft.starts_on.trim();
  const endsOn = draft.ends_on.trim();
  if (startsOn && !DATE.test(startsOn)) return { ok: false, error: "Choose a start date." };
  if (endsOn && !DATE.test(endsOn)) return { ok: false, error: "Choose a last day." };
  if (endsOn && endsOn < today) return { ok: false, error: "The last day has already passed." };
  if (startsOn && endsOn && endsOn < startsOn) return { ok: false, error: "The offer must end on or after the day it starts." };
  return {
    ok: true,
    input: {
      kind: "intro_rate",
      title,
      description: description || null,
      hours,
      price_per_hour_pence: pence,
      active: true,
      starts_at: startsOn ? londonMidnightIso(startsOn) : null,
      ends_at: endsOn ? londonMidnightIso(endsOn, 1) : null,
    },
  };
}

/**
 * Only what changed, for PATCH: the API answers 422 "Nothing to change" to an
 * empty patch, and an untouched end date must not be rewritten to midnight.
 */
export function promotionPatch(current: Promotion, input: PromotionInput): Partial<PromotionInput> {
  const patch: Partial<PromotionInput> = {};
  if (input.title !== current.title) patch.title = input.title;
  if ((input.description ?? null) !== (current.description ?? null)) patch.description = input.description;
  if (input.hours !== current.hours) patch.hours = input.hours;
  if (input.price_per_hour_pence !== current.price_per_hour_pence) patch.price_per_hour_pence = input.price_per_hour_pence;
  const before = draftFromPromotion(current);
  const startsOn = input.starts_at ? londonDateOf(input.starts_at) : "";
  const endsOn = input.ends_at ? lastDayOf(input.ends_at) : "";
  if (startsOn !== before.starts_on) patch.starts_at = input.starts_at;
  if (endsOn !== before.ends_on) patch.ends_at = input.ends_at;
  return patch;
}

/** The one active offer, live or scheduled; null when there is none. */
export function currentPromotion(promotions: Promotion[]): Promotion | null {
  return promotions.find((p) => p.active) ?? null;
}

/** "First 6 hours at £36 an hour". */
export function describePromotion(p: Pick<Promotion, "hours" | "price_per_hour_pence">): string {
  const span = p.hours === 1 ? "First hour" : `First ${p.hours} hours`;
  return `${span} at ${hourly(p.price_per_hour_pence)} an hour`;
}

export interface PromotionState {
  label: string;
  tone: "live" | "scheduled" | "ended";
}

/** Where the offer stands now, in words a school reads at a glance. */
export function promotionState(p: Promotion, nowMs = Date.now()): PromotionState {
  if (!p.active) return { label: `Ended ${shortDate(p.updated_at)}`.trim(), tone: "ended" };
  const starts = p.starts_at ? Date.parse(p.starts_at) : null;
  const ends = p.ends_at ? Date.parse(p.ends_at) : null;
  const lastDay = p.ends_at ? shortDate(lastDayOf(p.ends_at)) : "";
  if (ends !== null && ends <= nowMs) return { label: `Ended ${lastDay}`, tone: "ended" };
  if (starts !== null && starts > nowMs) {
    return { label: `Starts ${shortDate(p.starts_at)}${lastDay ? `, last day ${lastDay}` : ""}`, tone: "scheduled" };
  }
  return { label: lastDay ? `Live until ${lastDay}` : "Live now", tone: "live" };
}
