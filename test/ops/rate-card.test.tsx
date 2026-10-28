import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import FeeTermsFields, {
  EMPTY_FEE_TERMS_DRAFT,
  draftFromFeeTerms,
  feeTermsInputFromDraft,
  type FeeTermsDraft,
} from "@/components/ops/FeeTermsFields";
import {
  buildRateCardInput,
  describeFeeTerms,
  parseHoursToMinutes,
  rateCardFee,
  type RateCard,
} from "@/lib/organisations/fees";

// A real school's levy: first 6 hours (beginners offer) £5.04/hour, then £6.18/hour.
const levy: RateCard = {
  applies_to: "all_lessons",
  hours_counted: "school",
  bands: [
    { from_minutes: 0, charge: "per_hour", amount_pence: 504, percent_bps: null },
    { from_minutes: 360, charge: "per_hour", amount_pence: 618, percent_bps: null },
  ],
};

describe("rate card maths and wording (same rules as the API)", () => {
  it("charges by the learner's hours so far and splits a lesson across a band edge", () => {
    expect(rateCardFee(levy, 0, 60, 3600).fee_pence).toBe(504);
    expect(rateCardFee(levy, 420, 60, 3900).fee_pence).toBe(618);
    expect(rateCardFee(levy, 300, 120, 7800)).toEqual({ fee_pence: 1122, note: "1h at £5.04/hour + 1h at £6.18/hour" });
  });

  it("describes the card for ops and for the school", () => {
    const terms = { fee_mode: "rate_card" as const, amount_pence: null, percent_bps: null, rate_card: levy };
    expect(describeFeeTerms(terms, "ops")).toBe(
      "Every completed lesson. A learner's first 6h: £5.04/hour; after 6h: £6.18/hour. Hours counted across the school."
    );
    expect(describeFeeTerms({ ...terms, rate_card: { ...levy, applies_to: "school_learners" } }, "school")).toMatch(
      /^Completed lessons with learners you introduced\./
    );
  });

  it("parses band starts in quarter hours", () => {
    expect(parseHoursToMinutes("6")).toBe(360);
    expect(parseHoursToMinutes("6.5")).toBe(390);
    expect(parseHoursToMinutes("6.25")).toBe(375);
    expect(parseHoursToMinutes("6.1")).toBeNull();
    expect(parseHoursToMinutes("six")).toBeNull();
  });

  it("builds exactly the API body, and says what is wrong otherwise", () => {
    const draft = {
      applies_to: "all_lessons" as const,
      hours_counted: "school" as const,
      bands: [
        { fromHours: "0", charge: "per_hour" as const, value: "5.04" },
        { fromHours: "6", charge: "per_hour" as const, value: "6.18" },
      ],
    };
    expect(buildRateCardInput(draft)).toEqual({
      ok: true,
      input: {
        applies_to: "all_lessons",
        hours_counted: "school",
        bands: [
          { from_minutes: 0, charge: "per_hour", amount_pence: 504 },
          { from_minutes: 360, charge: "per_hour", amount_pence: 618 },
        ],
      },
    });
    expect(buildRateCardInput({ ...draft, bands: [draft.bands[0]!, { ...draft.bands[1]!, fromHours: "0" }] })).toMatchObject({ ok: false });
    expect(buildRateCardInput({ ...draft, bands: [{ ...draft.bands[0]!, value: "0" }] })).toEqual({
      ok: false,
      error: "At least one band must charge something.",
    });
  });

  it("round-trips a saved card through the form", () => {
    const draft = draftFromFeeTerms({
      organisation_id: "o",
      fee_mode: "rate_card",
      amount_pence: null,
      percent_bps: null,
      rate_card: levy,
      legacy: false,
      set_by_email: null,
      set_at: null,
    });
    expect(feeTermsInputFromDraft(draft)).toEqual({
      ok: true,
      input: {
        fee_mode: "rate_card",
        rate_card: {
          applies_to: "all_lessons",
          hours_counted: "school",
          bands: [
            { from_minutes: 0, charge: "per_hour", amount_pence: 504 },
            { from_minutes: 360, charge: "per_hour", amount_pence: 618 },
          ],
        },
      },
    });
  });
});

function Harness() {
  const [draft, setDraft] = useState<FeeTermsDraft>(EMPTY_FEE_TERMS_DRAFT);
  return <FeeTermsFields draft={draft} onChange={setDraft} idPrefix="t" />;
}

describe("the rate card builder", () => {
  it("builds the school's levy and previews what lessons would be charged", () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Levy rate card" }));
    fireEvent.change(container.querySelector("#t-band-0-value")!, { target: { value: "5.04" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Add a band" }));
    fireEvent.change(container.querySelector("#t-band-1-value")!, { target: { value: "6.18" } });

    expect(screen.getByText("1h lesson at hour 0")).toBeTruthy();
    expect(screen.getByText("£5.04")).toBeTruthy();
    expect(screen.getByText("2h lesson across hour 6")).toBeTruthy();
    expect(screen.getByText("£11.22")).toBeTruthy();
    expect(screen.getByText("£6.18")).toBeTruthy();
    // £6.18 of a £39 hour.
    expect(screen.getByText("15.8%")).toBeTruthy();
  });
});
