"use client";

import {
  FEE_MODE_OPTIONS,
  buildFeeTermsInput,
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
}

export const EMPTY_FEE_TERMS_DRAFT: FeeTermsDraft = { mode: "off", amount: "", percent: "" };

/**
 * The form state for a school's current terms. A legacy mode has no
 * equivalent among the current four, so nothing is pre-selected and the
 * founder has to choose deliberately.
 */
export function draftFromFeeTerms(terms: FeeTerms | null): FeeTermsDraft {
  if (!terms) return EMPTY_FEE_TERMS_DRAFT;
  if (!isCurrentFeeMode(terms.fee_mode)) return { mode: null, amount: "", percent: "" };
  return {
    mode: terms.fee_mode,
    amount: terms.amount_pence != null ? (terms.amount_pence / 100).toFixed(2) : "",
    percent: terms.percent_bps != null ? String(terms.percent_bps / 100) : "",
  };
}

export function feeTermsInputFromDraft(draft: FeeTermsDraft) {
  if (!draft.mode) return { ok: false as const, error: "Choose what this school charges its instructors." };
  return buildFeeTermsInput(draft.mode, draft.amount, draft.percent);
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

/** Four pills and the one amount the chosen mode needs. */
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
