import { describe, expect, it } from "vitest";
import { describePolicy, draftFromPolicy, policyInputFromDraft } from "@/lib/organisations/cancellation-policy";

const ORG = "11111111-2222-4333-8444-555555555555";

describe("policyInputFromDraft", () => {
  it("accepts every value the API allows and sends numbers", () => {
    for (const hours of [2, 6, 12, 24, 48, 72]) {
      for (const bps of [0, 5000, 10000]) {
        expect(policyInputFromDraft(ORG, { notice_hours: String(hours), late_fee_bps: String(bps) })).toEqual({
          ok: true,
          input: { organisation_id: ORG, notice_hours: hours, late_fee_bps: bps },
        });
      }
    }
  });

  it("refuses values the API would 422", () => {
    expect(policyInputFromDraft(ORG, { notice_hours: "36", late_fee_bps: "5000" }).ok).toBe(false);
    expect(policyInputFromDraft(ORG, { notice_hours: "24", late_fee_bps: "2500" }).ok).toBe(false);
    expect(policyInputFromDraft(ORG, { notice_hours: "", late_fee_bps: "0" }).ok).toBe(false);
    expect(policyInputFromDraft(ORG, { notice_hours: "24.5", late_fee_bps: "0" }).ok).toBe(false);
  });

  it("round-trips a stored policy through the form", () => {
    const draft = draftFromPolicy({ notice_hours: 48, late_fee_bps: 10000 });
    expect(policyInputFromDraft(ORG, draft)).toMatchObject({ ok: true, input: { notice_hours: 48, late_fee_bps: 10000 } });
  });
});

describe("describePolicy", () => {
  it("words the policy for the school", () => {
    expect(describePolicy({ notice_hours: 24, late_fee_bps: 5000 })).toBe(
      "A learner who cancels with less than 24 hours' notice pays half the lesson price."
    );
    expect(describePolicy({ notice_hours: 12, late_fee_bps: 0 })).toBe("A learner who cancels with less than 12 hours' notice pays nothing.");
  });
});
