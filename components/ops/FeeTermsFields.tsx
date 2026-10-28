"use client";

import { useState } from "react";

import {
  EMPTY_RATE_CARD_DRAFT,
  FEE_MODE_OPTIONS,
  RATE_CARD_MAX_BANDS,
  RATE_CHARGE_OPTIONS,
  buildFeeTermsInput,
  buildRateCardInput,
  draftFromRateCard,
  rateCardFee,
  rateCardFromInput,
  type RateBandDraft,
  type RateCardDraft,
  describeFeeTerms,
  feeModeLabel,
  isCurrentFeeMode,
  parsePercentToBps,
  parsePoundsToPence,
  type CurrentFeeMode,
  type FeeTerms,
} from "@/lib/organisations/fees";
import { formatPence } from "@/lib/ops/types";

export interface FeeTermsDraft {
  /** Null until the founder picks one (a legacy school starts here). */
  mode: CurrentFeeMode | null;
  amount: string;
  percent: string;
  /** The rate card being built, kept while the founder tries other modes. */
  rateCard: RateCardDraft;
}

export const EMPTY_FEE_TERMS_DRAFT: FeeTermsDraft = { mode: "off", amount: "", percent: "", rateCard: EMPTY_RATE_CARD_DRAFT };

/**
 * The form state for a school's current terms. A legacy mode has no
 * equivalent among the current four, so nothing is pre-selected and the
 * founder has to choose deliberately.
 */
export function draftFromFeeTerms(terms: FeeTerms | null): FeeTermsDraft {
  if (!terms) return EMPTY_FEE_TERMS_DRAFT;
  if (!isCurrentFeeMode(terms.fee_mode)) return { mode: null, amount: "", percent: "", rateCard: EMPTY_RATE_CARD_DRAFT };
  return {
    mode: terms.fee_mode,
    amount: terms.amount_pence != null ? (terms.amount_pence / 100).toFixed(2) : "",
    percent: terms.percent_bps != null ? String(terms.percent_bps / 100) : "",
    rateCard: draftFromRateCard(terms.rate_card),
  };
}

export function feeTermsInputFromDraft(draft: FeeTermsDraft) {
  if (!draft.mode) return { ok: false as const, error: "Choose what this school charges its instructors." };
  return buildFeeTermsInput(draft.mode, draft.amount, draft.percent, draft.rateCard);
}

/**
 * The API's 422 for fee terms carries `details.allowed_modes`. Name them, so
 * the founder sees what is accepted rather than a bare "invalid body".
 */
export function feeTermsErrorMessage(body: { error?: unknown; details?: unknown } | null, fallback: string): string {
  const message = typeof body?.error === "string" && body.error ? body.error : fallback;
  const details = body?.details as { allowed_modes?: unknown } | undefined;
  if (Array.isArray(details?.allowed_modes) && details.allowed_modes.length) {
    const names = details.allowed_modes.map((mode) => feeModeLabel(String(mode))).join(", ");
    return `${message} Allowed: ${names}.`;
  }
  return message;
}

/** The mode pills and what the chosen mode needs: one amount, or a rate card. */
export default function FeeTermsFields({
  draft,
  onChange,
  idPrefix,
}: {
  draft: FeeTermsDraft;
  onChange: (next: FeeTermsDraft) => void;
  idPrefix: string;
}) {
  const amountPence = parsePoundsToPence(draft.amount);
  const percentBps = parsePercentToBps(draft.percent);
  const example =
    draft.mode === "lead_percent" && percentBps
      ? `A £45.00 lesson → ${formatPence(Math.round((4500 * percentBps) / 10000))} to the school`
      : draft.mode === "lead_fixed" && amountPence
        ? `8 lead lessons in a week → ${formatPence(amountPence * 8)}`
        : draft.mode === "flat_weekly" && amountPence
          ? `${formatPence(amountPence)} per instructor, every week`
          : null;
  const hint = FEE_MODE_OPTIONS.find((option) => option.value === draft.mode)?.hint;

  return (
    <div className="space-y-4">
      <div role="group" aria-labelledby={`${idPrefix}-fee-mode-label`}>
        <p id={`${idPrefix}-fee-mode-label`} className="text-sm font-medium text-ink">
          Fee mode
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FEE_MODE_OPTIONS.map((option) => {
            const on = draft.mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ ...draft, mode: option.value })}
                aria-pressed={on}
                className={`rounded-full border px-4 py-2 text-sm ${
                  on ? "border-racing-green bg-racing-green text-white" : "border-border text-ink"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {hint ? <p className="mt-2 text-xs text-ink-muted">{hint}</p> : null}
      </div>

      {draft.mode === "lead_percent" ? (
        <label className="block max-w-xs text-sm font-medium text-ink">
          Percentage of each lesson
          <span className="relative mt-1 block">
            <input
              inputMode="decimal"
              required
              value={draft.percent}
              onChange={(e) => onChange({ ...draft, percent: e.target.value })}
              placeholder="10"
              className="w-full rounded-xl border border-border px-3 py-2 pr-8 text-ink"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-secondary">%</span>
          </span>
          <span className="mt-1 block text-xs text-ink-muted">
            Of what each lesson collected, after refunds. Cash lessons count at their recorded amount.
          </span>
        </label>
      ) : draft.mode === "lead_fixed" || draft.mode === "flat_weekly" ? (
        <label className="block max-w-xs text-sm font-medium text-ink">
          {draft.mode === "lead_fixed" ? "Amount per lead lesson (£)" : "Weekly fee per instructor (£)"}
          <span className="relative mt-1 block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary">£</span>
            <input
              inputMode="decimal"
              required
              value={draft.amount}
              onChange={(e) => onChange({ ...draft, amount: e.target.value })}
              placeholder="5.00"
              className="w-full rounded-xl border border-border px-3 py-2 pl-7 text-ink"
            />
          </span>
        </label>
      ) : draft.mode === "rate_card" ? (
        <RateCardFields card={draft.rateCard} onChange={(rateCard) => onChange({ ...draft, rateCard })} idPrefix={idPrefix} />
      ) : null}

      {example ? (
        <p className="rounded-xl border border-border bg-canvas px-4 py-3 text-sm text-ink">For example: {example}</p>
      ) : null}
    </div>
  );
}

/** The current terms in one line, with a legacy badge for the earlier modes. */
export function FeeTermsSummary({ terms }: { terms: FeeTerms | null }) {
  if (!terms) return <p className="text-sm text-ink-muted">Fee terms not loaded.</p>;
  return (
    <div>
      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
        {feeModeLabel(terms.fee_mode)}
        {terms.legacy ? <LegacyBadge /> : null}
      </p>
      <p className="mt-0.5 text-sm text-ink-secondary">{describeFeeTerms(terms, "ops")}</p>
    </div>
  );
}

export function LegacyBadge() {
  return (
    <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-900">
      Legacy
    </span>
  );
}

function Pills<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={on}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              on ? "border-racing-green bg-racing-green text-white" : "border-border text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The rate card builder: which lessons it covers, how a learner's hours are
 * counted, and up to six bands by the learner's hours so far. Below it, what
 * a few typical lessons would be charged, so the founder can check the card
 * against the figures the school gave.
 */
export function RateCardFields({
  card,
  onChange,
  idPrefix,
}: {
  card: RateCardDraft;
  onChange: (next: RateCardDraft) => void;
  idPrefix: string;
}) {
  const setBand = (i: number, patch: Partial<RateBandDraft>) =>
    onChange({ ...card, bands: card.bands.map((band, j) => (j === i ? { ...band, ...patch } : band)) });
  const addBand = () => {
    const last = card.bands[card.bands.length - 1];
    const lastFrom = Number(last?.fromHours) || 0;
    onChange({ ...card, bands: [...card.bands, { fromHours: String(lastFrom + 6), charge: last?.charge ?? "per_hour", value: "" }] });
  };
  const removeBand = (i: number) => onChange({ ...card, bands: card.bands.filter((_, j) => j !== i) });
  const built = buildRateCardInput(card);

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-ink">Applies to</p>
          <div className="mt-2">
            <Pills
              label="Applies to"
              value={card.applies_to}
              onChange={(applies_to) => onChange({ ...card, applies_to })}
              options={[
                { value: "all_lessons", label: "Every lesson" },
                { value: "school_learners", label: "School's own learners only" },
              ]}
            />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Count a learner&apos;s hours</p>
          <div className="mt-2">
            <Pills
              label="Count a learner's hours"
              value={card.hours_counted}
              onChange={(hours_counted) => onChange({ ...card, hours_counted })}
              options={[
                { value: "school", label: "Across the school" },
                { value: "instructor", label: "With that instructor" },
              ]}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-ink">Bands, by the learner&apos;s hours so far</p>
        <ol className="mt-2 space-y-2">
          {card.bands.map((band, i) => {
            const next = card.bands[i + 1];
            return (
              <li key={i} className="flex flex-wrap items-end gap-3 rounded-lg bg-canvas px-3 py-2">
                <label className="block w-28 text-xs font-medium text-ink-secondary">
                  From hour
                  <input
                    id={`${idPrefix}-band-${i}-from`}
                    inputMode="decimal"
                    disabled={i === 0}
                    value={i === 0 ? "0" : band.fromHours}
                    onChange={(e) => setBand(i, { fromHours: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-ink disabled:bg-canvas"
                  />
                </label>
                <span className="pb-2 text-xs text-ink-muted">{next ? `to ${next.fromHours || "?"}h` : "onwards"}</span>
                <div className="pb-0.5">
                  <Pills label={`Band ${i + 1} charge`} value={band.charge} onChange={(charge) => setBand(i, { charge })} options={RATE_CHARGE_OPTIONS} />
                </div>
                <label className="block w-28 text-xs font-medium text-ink-secondary">
                  {band.charge === "percent" ? "Percent" : "Amount (£)"}
                  <input
                    id={`${idPrefix}-band-${i}-value`}
                    inputMode="decimal"
                    value={band.value}
                    onChange={(e) => setBand(i, { value: e.target.value })}
                    placeholder={band.charge === "percent" ? "15" : "6.18"}
                    className="mt-1 w-full rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-ink"
                  />
                </label>
                {i > 0 ? (
                  <button type="button" onClick={() => removeBand(i)} className="pb-2 text-xs font-semibold text-deep-rose">
                    Remove
                  </button>
                ) : null}
              </li>
            );
          })}
        </ol>
        {card.bands.length < RATE_CARD_MAX_BANDS ? (
          <button type="button" onClick={addBand} className="mt-2 text-sm font-semibold text-racing-green">
            + Add a band
          </button>
        ) : null}
      </div>

      {built.ok ? <RateCardPreview input={built.input} /> : <p className="text-xs text-ink-muted">{built.error}</p>}
    </div>
  );
}

/**
 * Typical lessons under the card: an hour at the start of each band, and a
 * two-hour lesson across each band edge. The lesson price is editable so the
 * effective percentage can be compared with what the school quoted (their
 * beginners offer is a different price from their standard lessons).
 */
function RateCardPreview({ input }: { input: Parameters<typeof rateCardFromInput>[0] }) {
  const card = rateCardFromInput(input);
  const [price, setPrice] = useState("39.00");
  const priceExample = parsePoundsToPence(price) ?? 0;
  const rows: Array<{ label: string; prior: number; minutes: number }> = [];
  card.bands.forEach((band, i) => {
    rows.push({ label: `1h lesson at hour ${band.from_minutes / 60}`, prior: band.from_minutes, minutes: 60 });
    const next = card.bands[i + 1];
    if (next && next.from_minutes - band.from_minutes >= 60) {
      rows.push({ label: `2h lesson across hour ${next.from_minutes / 60}`, prior: next.from_minutes - 60, minutes: 120 });
    }
  });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-sm font-medium text-ink">Check it</p>
        <label className="flex items-center gap-2 text-xs text-ink-secondary">
          Lesson price per hour £
          <input
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-20 rounded-lg border border-border px-2 py-1 text-sm text-ink"
          />
        </label>
      </div>
      <p className="text-xs text-ink-muted">The % column is the levy as a share of that price.</p>
      <table className="mt-2 w-full text-left text-sm">
        <tbody>
          {rows.map((row) => {
            const lessonPrice = Math.round((priceExample * row.minutes) / 60);
            const { fee_pence, note } = rateCardFee(card, row.prior, row.minutes, lessonPrice);
            return (
              <tr key={row.label} className="border-b border-border last:border-0">
                <td className="py-1.5 pr-3 text-ink">{row.label}</td>
                <td className="py-1.5 pr-3 text-xs text-ink-secondary">{note}</td>
                <td className="py-1.5 pr-3 text-right font-semibold tabular-nums">{formatPence(fee_pence)}</td>
                <td className="py-1.5 text-right text-xs tabular-nums text-ink-muted">
                  {lessonPrice ? `${((fee_pence / lessonPrice) * 100).toFixed(1)}%` : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
