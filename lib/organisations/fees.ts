/**
 * What a school charges its instructors (organisation_instructor_billing), as
 * the API describes it. Newdryve sets these terms when it onboards a school;
 * the school can read them but not change them.
 *
 * Client-safe: no server imports, so the ops panel and the school portal both
 * use it.
 */

/** The modes ops can choose from now on. */
export const CURRENT_FEE_MODES = ["off", "lead_percent", "lead_fixed", "flat_weekly", "rate_card"] as const;
export type CurrentFeeMode = (typeof CURRENT_FEE_MODES)[number];

/**
 * The earlier modes a school chose for itself. Still invoiced for the schools
 * that have them, never offered again: ops re-sets them to a current mode.
 */
export const LEGACY_FEE_MODES = ["per_hour", "per_lesson", "percent_of_revenue"] as const;
export type LegacyFeeMode = (typeof LEGACY_FEE_MODES)[number];

export type FeeMode = CurrentFeeMode | LegacyFeeMode;

/** GET/PUT /v1/ops/organisations/:id/fee-terms, and `fee_terms` on each organisation. */
export interface FeeTerms {
  organisation_id: string;
  fee_mode: FeeMode;
  amount_pence: number | null;
  percent_bps: number | null;
  /** The levy rules for fee_mode "rate_card"; null otherwise. */
  rate_card?: RateCard | null;
  /** True for per_hour / per_lesson / percent_of_revenue. */
  legacy: boolean;
  set_by_email: string | null;
  set_at: string | null;
}

/** Exactly the field each mode needs; the API rejects any other key. */
export type FeeTermsInput =
  | { fee_mode: "off" }
  | { fee_mode: "lead_percent"; percent_bps: number }
  | { fee_mode: "lead_fixed"; amount_pence: number }
  | { fee_mode: "flat_weekly"; amount_pence: number }
  | { fee_mode: "rate_card"; rate_card: RateCardInput };

/** The API's limits (backend feeTermsSchema). */
export const MAX_FEE_AMOUNT_PENCE = 1_000_000;
export const MAX_FEE_PERCENT_BPS = 10_000;

export const FEE_MODE_OPTIONS: Array<{ value: CurrentFeeMode; label: string; hint: string }> = [
  { value: "off", label: "Off", hint: "No invoices are raised." },
  {
    value: "lead_percent",
    label: "Lead fee, % of each lesson",
    hint: "A share of every lesson a learner the school introduced takes with that instructor.",
  },
  {
    value: "lead_fixed",
    label: "Lead fee, fixed £ per lesson",
    hint: "A set amount for every completed lesson of a learner the school introduced.",
  },
  {
    value: "flat_weekly",
    label: "Flat weekly fee",
    hint: "The same amount per instructor every week they are a member.",
  },
  {
    value: "rate_card",
    label: "Levy rate card",
    hint: "Rates by the learner's hours so far, e.g. a beginners rate for the first 6 hours, then a standard rate. Per hour, per lesson or a %.",
  },
];

export function isLegacyFeeMode(mode: string): mode is LegacyFeeMode {
  return (LEGACY_FEE_MODES as readonly string[]).includes(mode);
}

export function isCurrentFeeMode(mode: string): mode is CurrentFeeMode {
  return (CURRENT_FEE_MODES as readonly string[]).includes(mode);
}

function pounds(pence: number | null | undefined): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format((pence ?? 0) / 100);
}

/** 1250 → "12.5%". */
export function percentLabel(bps: number | null | undefined): string {
  const value = (bps ?? 0) / 100;
  return `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, "")}%`;
}

/** A short name for the mode, for a badge or table cell. */
export function feeModeLabel(mode: FeeMode | string): string {
  switch (mode) {
    case "off":
      return "Off";
    case "lead_percent":
      return "Lead fee (%)";
    case "lead_fixed":
      return "Lead fee (fixed)";
    case "flat_weekly":
      return "Flat weekly fee";
    case "rate_card":
      return "Levy rate card";
    case "per_hour":
      return "Per hour taught";
    case "per_lesson":
      return "Per lesson";
    case "percent_of_revenue":
      return "Share of takings";
    default:
      return mode;
  }
}

/**
 * The terms in plain English, e.g. "10% of every lesson a learner you
 * introduced takes with that instructor". `audience` picks the pronoun: the
 * school reads "you", Newdryve reads "the school".
 */
export function describeFeeTerms(
  terms: Pick<FeeTerms, "fee_mode" | "amount_pence" | "percent_bps"> & { rate_card?: RateCard | null },
  audience: "school" | "ops" = "school"
): string {
  const who = audience === "school" ? "you" : "the school";
  switch (terms.fee_mode) {
    case "off":
      return "No fee. No invoices are raised.";
    case "lead_percent":
      return `${percentLabel(terms.percent_bps)} of every lesson a learner ${who} introduced takes with that instructor, on what the lesson collected after refunds.`;
    case "lead_fixed":
      return `${pounds(terms.amount_pence)} for every completed lesson a learner ${who} introduced takes with that instructor.`;
    case "flat_weekly":
      return `${pounds(terms.amount_pence)} per instructor, every week they are a member.`;
    case "rate_card":
      return terms.rate_card ? describeRateCard(terms.rate_card, who) : "A levy rate card (not set).";
    case "per_hour":
      return `${pounds(terms.amount_pence)} for every hour of completed lessons.`;
    case "per_lesson":
      return `${pounds(terms.amount_pence)} for every completed lesson.`;
    case "percent_of_revenue":
      return `${percentLabel(terms.percent_bps)} of what the instructor's lessons earned.`;
    default:
      return "Unknown terms.";
  }
}

/**
 * "12.50" → 1250. Parsed from the digits rather than multiplied as a float:
 * 29.99 * 100 is 2998.9999999999995, and a rounding slip here is an invoice.
 * Null for anything that is not a positive amount with at most two decimals.
 */
export function parsePoundsToPence(value: string): number | null {
  const match = value.trim().replace(/^£/, "").replace(/,/g, "").match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const pence = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(pence) ? pence : null;
}

/** "12.5" → 1250 basis points. At most two decimals. */
export function parsePercentToBps(value: string): number | null {
  const match = value.trim().replace(/%$/, "").trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const bps = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(bps) ? bps : null;
}

/** 1250 → "12.50" for an input's initial value. */
export function penceToPoundsInput(pence: number | null | undefined): string {
  return pence == null ? "" : (pence / 100).toFixed(2);
}

/** 1250 → "12.5" for an input's initial value. */
export function bpsToPercentInput(bps: number | null | undefined): string {
  if (bps == null) return "";
  const value = bps / 100;
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

/**
 * Build the API body from what the founder typed, or say what is wrong with
 * it. The same rules as the API, so a mistake is caught before the round trip.
 */
export function buildFeeTermsInput(
  mode: CurrentFeeMode,
  amountPounds: string,
  percent: string,
  rateCard: RateCardDraft = EMPTY_RATE_CARD_DRAFT
): { ok: true; input: FeeTermsInput } | { ok: false; error: string } {
  if (mode === "off") return { ok: true, input: { fee_mode: "off" } };
  if (mode === "rate_card") {
    const card = buildRateCardInput(rateCard);
    return card.ok ? { ok: true, input: { fee_mode: "rate_card", rate_card: card.input } } : card;
  }
  if (mode === "lead_percent") {
    const bps = parsePercentToBps(percent);
    if (bps == null || bps < 1 || bps > MAX_FEE_PERCENT_BPS) {
      return { ok: false, error: "Enter a percentage between 0.01 and 100, like 10 or 12.5." };
    }
    return { ok: true, input: { fee_mode: "lead_percent", percent_bps: bps } };
  }
  const pence = parsePoundsToPence(amountPounds);
  if (pence == null || pence < 1 || pence > MAX_FEE_AMOUNT_PENCE) {
    return { ok: false, error: "Enter an amount between £0.01 and £10,000, like 5 or 7.50." };
  }
  return { ok: true, input: { fee_mode: mode, amount_pence: pence } };
}

// ---------------------------------------------------------------------------
// Levy rate card
// ---------------------------------------------------------------------------

/**
 * A levy built from bands keyed on how many hours the learner has already
 * had, each charging per hour, per lesson or a percentage of what the lesson
 * collected. Mirrors backend lib/organisations/rate-card.ts; the API is the
 * validator and the invoice maths lives there. The copy here is for the form
 * and its live preview only.
 */
export const RATE_CARD_SCOPES = ["all_lessons", "school_learners"] as const;
export type RateCardScope = (typeof RATE_CARD_SCOPES)[number];
export const RATE_CARD_HOURS_COUNTED = ["school", "instructor"] as const;
export type RateCardHoursCounted = (typeof RATE_CARD_HOURS_COUNTED)[number];
export const RATE_CHARGES = ["per_hour", "per_lesson", "percent"] as const;
export type RateCharge = (typeof RATE_CHARGES)[number];

export const RATE_CARD_MAX_BANDS = 6;
export const RATE_BAND_STEP_MINUTES = 15;
export const RATE_BAND_MAX_MINUTES = 1000 * 60;

export interface RateBand {
  from_minutes: number;
  charge: RateCharge;
  amount_pence: number | null;
  percent_bps: number | null;
}

export interface RateCard {
  applies_to: RateCardScope;
  hours_counted: RateCardHoursCounted;
  bands: RateBand[];
}

/** What the API takes: each band carries only the field its charge needs. */
export type RateBandInput =
  | { from_minutes: number; charge: "per_hour" | "per_lesson"; amount_pence: number }
  | { from_minutes: number; charge: "percent"; percent_bps: number };

export interface RateCardInput {
  applies_to: RateCardScope;
  hours_counted: RateCardHoursCounted;
  bands: RateBandInput[];
}

export const RATE_CHARGE_OPTIONS: Array<{ value: RateCharge; label: string }> = [
  { value: "per_hour", label: "£ per hour" },
  { value: "per_lesson", label: "£ per lesson" },
  { value: "percent", label: "% of lesson" },
];

function hoursLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function rateLabel(band: Pick<RateBand, "charge" | "amount_pence" | "percent_bps">): string {
  switch (band.charge) {
    case "per_hour":
      return `${pounds(band.amount_pence)}/hour`;
    case "per_lesson":
      return `${pounds(band.amount_pence)}/lesson`;
    case "percent":
      return percentLabel(band.percent_bps);
  }
}

function sortedBands(card: RateCard): RateBand[] {
  return [...card.bands].sort((a, b) => a.from_minutes - b.from_minutes);
}

/** Same wording as the API's describeRateCard. */
export function describeRateCard(card: RateCard, who = "the school"): string {
  const bands = sortedBands(card);
  const scope = card.applies_to === "all_lessons" ? "Every completed lesson" : `Completed lessons with learners ${who} introduced`;
  const parts = bands.map((band, i) => {
    const next = bands[i + 1];
    const range =
      bands.length === 1
        ? "Every hour"
        : i === 0
          ? `A learner's first ${hoursLabel(next!.from_minutes)}`
          : next
            ? `${hoursLabel(band.from_minutes)} to ${hoursLabel(next.from_minutes)}`
            : `after ${hoursLabel(band.from_minutes)}`;
    return `${range}: ${rateLabel(band)}`;
  });
  const counted =
    bands.length > 1 ? (card.hours_counted === "school" ? " Hours counted across the school." : " Hours counted per instructor.") : "";
  return `${scope}. ${parts.join("; ")}.${counted}`;
}

/**
 * What a lesson is charged: `prior` minutes the learner has already had,
 * `minutes` long, `collected` pence. A lesson across a band edge is split by
 * minutes; a per-lesson band charges the lesson that starts in it. Same
 * rules as the API (rateCardLine), rounded once.
 */
export function rateCardFee(card: RateCard, prior: number, minutes: number, collected: number): { fee_pence: number; note: string } {
  const bands = sortedBands(card);
  const start = Math.max(0, prior);
  const end = start + minutes;
  let fee = 0;
  const parts: string[] = [];
  bands.forEach((band, i) => {
    const bandEnd = bands[i + 1]?.from_minutes ?? Number.POSITIVE_INFINITY;
    const startsHere = start >= band.from_minutes && start < bandEnd;
    const overlap = Math.max(0, Math.min(end, bandEnd) - Math.max(start, band.from_minutes));
    const share = minutes > 0 ? overlap / minutes : startsHere ? 1 : 0;
    if (band.charge === "per_lesson") {
      if (!startsHere) return;
      fee += band.amount_pence ?? 0;
      parts.push(`1 lesson at ${rateLabel(band)}`);
      return;
    }
    if (share <= 0) return;
    fee += band.charge === "per_hour" ? (overlap * (band.amount_pence ?? 0)) / 60 : (collected * share * (band.percent_bps ?? 0)) / 10_000;
    parts.push(`${hoursLabel(overlap)} at ${rateLabel(band)}`);
  });
  return { fee_pence: Math.round(fee), note: parts.join(" + ") };
}

/** The form's editable copy of one band: text as typed. */
export interface RateBandDraft {
  /** Hours the band starts at, e.g. "6" or "6.5". The first band is always 0. */
  fromHours: string;
  charge: RateCharge;
  /** £ for per_hour / per_lesson, % for percent. */
  value: string;
}

export interface RateCardDraft {
  applies_to: RateCardScope;
  hours_counted: RateCardHoursCounted;
  bands: RateBandDraft[];
}

export const EMPTY_RATE_CARD_DRAFT: RateCardDraft = {
  applies_to: "all_lessons",
  hours_counted: "school",
  bands: [{ fromHours: "0", charge: "per_hour", value: "" }],
};

/** "6.5" → 390 minutes; null unless a non-negative number of quarter hours. */
export function parseHoursToMinutes(value: string): number | null {
  const match = value.trim().replace(/h$/i, "").trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const hundredths = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  const minutes = (hundredths * 60) / 100;
  if (!Number.isInteger(minutes) || minutes % RATE_BAND_STEP_MINUTES !== 0) return null;
  return minutes;
}

function minutesToHoursInput(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : String(Number(hours.toFixed(2)));
}

export function draftFromRateCard(card: RateCard | null | undefined): RateCardDraft {
  if (!card || !card.bands.length) return EMPTY_RATE_CARD_DRAFT;
  return {
    applies_to: card.applies_to,
    hours_counted: card.hours_counted,
    bands: sortedBands(card).map((b) => ({
      fromHours: minutesToHoursInput(b.from_minutes),
      charge: b.charge,
      value: b.charge === "percent" ? bpsToPercentInput(b.percent_bps) : penceToPoundsInput(b.amount_pence),
    })),
  };
}

/**
 * The API body for a rate card from what the founder typed, or what is wrong
 * with it. The same rules as the API's rateCardSchema.
 */
export function buildRateCardInput(draft: RateCardDraft): { ok: true; input: RateCardInput } | { ok: false; error: string } {
  if (!draft.bands.length) return { ok: false, error: "Add at least one band." };
  if (draft.bands.length > RATE_CARD_MAX_BANDS) return { ok: false, error: `At most ${RATE_CARD_MAX_BANDS} bands.` };
  const bands: RateBandInput[] = [];
  for (const [i, band] of draft.bands.entries()) {
    const n = i + 1;
    const from = i === 0 ? 0 : parseHoursToMinutes(band.fromHours);
    if (from == null || from > RATE_BAND_MAX_MINUTES) {
      return { ok: false, error: `Band ${n}: enter the hour it starts at, in quarter hours, like 6 or 6.5.` };
    }
    if (i > 0 && from <= bands[i - 1]!.from_minutes) {
      return { ok: false, error: `Band ${n} must start after band ${i}.` };
    }
    if (band.charge === "percent") {
      const bps = parsePercentToBps(band.value);
      if (bps == null || bps > MAX_FEE_PERCENT_BPS) return { ok: false, error: `Band ${n}: enter a percentage between 0 and 100.` };
      bands.push({ from_minutes: from, charge: "percent", percent_bps: bps });
    } else {
      const pence = parsePoundsToPence(band.value);
      if (pence == null || pence > MAX_FEE_AMOUNT_PENCE) return { ok: false, error: `Band ${n}: enter an amount like 5.04.` };
      bands.push({ from_minutes: from, charge: band.charge, amount_pence: pence });
    }
  }
  if (bands.every((b) => ("amount_pence" in b ? b.amount_pence : b.percent_bps) === 0)) {
    return { ok: false, error: "At least one band must charge something." };
  }
  return { ok: true, input: { applies_to: draft.applies_to, hours_counted: draft.hours_counted, bands } };
}

/** The stored shape of a card the founder is still typing, for the preview. */
export function rateCardFromInput(input: RateCardInput): RateCard {
  return {
    applies_to: input.applies_to,
    hours_counted: input.hours_counted,
    bands: input.bands.map((b) => ({
      from_minutes: b.from_minutes,
      charge: b.charge,
      amount_pence: "amount_pence" in b ? b.amount_pence : null,
      percent_bps: "percent_bps" in b ? b.percent_bps : null,
    })),
  };
}
