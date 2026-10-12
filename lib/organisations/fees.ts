/**
 * What a school charges its instructors (organisation_instructor_billing), as
 * the API describes it. Newdryve sets these terms when it onboards a school;
 * the school can read them but not change them.
 *
 * Client-safe: no server imports, so the ops panel and the school portal both
 * use it.
 */

/** The modes ops can choose from now on. */
export const CURRENT_FEE_MODES = ["off", "lead_percent", "lead_fixed", "flat_weekly"] as const;
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
  | { fee_mode: "flat_weekly"; amount_pence: number };

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
  terms: Pick<FeeTerms, "fee_mode" | "amount_pence" | "percent_bps">,
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
  percent: string
): { ok: true; input: FeeTermsInput } | { ok: false; error: string } {
  if (mode === "off") return { ok: true, input: { fee_mode: "off" } };
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
