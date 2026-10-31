import { describe, expect, it } from "vitest";
import {
  currentPromotion,
  describePromotion,
  draftFromPromotion,
  emptyDraft,
  londonMidnightIso,
  parsePounds,
  promotionInputFromDraft,
  promotionPatch,
  promotionState,
  type Promotion,
} from "@/lib/organisations/promotions";

const ORG = "11111111-2222-4333-8444-555555555555";

function promo(over: Partial<Promotion> = {}): Promotion {
  return {
    id: "22222222-3333-4444-8555-666666666666",
    organisation_id: ORG,
    kind: "intro_rate",
    title: "Intro offer",
    description: null,
    hours: 6,
    price_per_hour_pence: 3600,
    active: true,
    starts_at: null,
    ends_at: null,
    live: true,
    updated_by: "school",
    updated_by_email: "ana@acme.test",
    created_at: "2026-10-31T10:00:00.000Z",
    updated_at: "2026-10-31T10:00:00.000Z",
    ...over,
  };
}

const TODAY = "2026-10-31";

describe("pounds and London days", () => {
  it("reads what people type for a price", () => {
    expect(parsePounds("36")).toBe(3600);
    expect(parsePounds("£36.50")).toBe(3650);
    expect(parsePounds("1,000")).toBe(100_000);
    expect(parsePounds("36.555")).toBeNull();
    expect(parsePounds("abc")).toBeNull();
    expect(parsePounds("")).toBeNull();
  });

  it("turns a London day into the instant it begins, in winter and summer", () => {
    expect(londonMidnightIso("2026-11-30")).toBe("2026-11-30T00:00:00.000Z");
    expect(londonMidnightIso("2026-07-01")).toBe("2026-06-30T23:00:00.000Z");
    // The day after, for an inclusive last day.
    expect(londonMidnightIso("2026-11-30", 1)).toBe("2026-12-01T00:00:00.000Z");
    expect(londonMidnightIso("2026-10-31", 1)).toBe("2026-11-01T00:00:00.000Z");
  });
});

describe("promotionInputFromDraft", () => {
  it("builds the API's body from the form, with no window by default", () => {
    const checked = promotionInputFromDraft({ ...emptyDraft(), hours: "6", price_per_hour: "36" }, TODAY);
    expect(checked).toEqual({
      ok: true,
      input: {
        kind: "intro_rate",
        title: "Intro offer",
        description: null,
        hours: 6,
        price_per_hour_pence: 3600,
        active: true,
        starts_at: null,
        ends_at: null,
      },
    });
  });

  it("starts at the start of the first day and stops at the end of the last", () => {
    const checked = promotionInputFromDraft(
      { ...emptyDraft(), hours: "6", price_per_hour: "36", starts_on: "2026-11-02", ends_on: "2026-11-30", description: "  Welcome  " },
      TODAY
    );
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    expect(checked.input.starts_at).toBe("2026-11-02T00:00:00.000Z");
    expect(checked.input.ends_at).toBe("2026-12-01T00:00:00.000Z");
    expect(checked.input.description).toBe("Welcome");
  });

  it.each([
    [{ title: "   " }, "Give the offer a title."],
    [{ hours: "0" }, "Cover a whole number of hours, from 1 to 100."],
    [{ hours: "2.5" }, "Cover a whole number of hours, from 1 to 100."],
    [{ hours: "101" }, "Cover a whole number of hours, from 1 to 100."],
    [{ price_per_hour: "0" }, "Set an hourly price between £0.01 and £1,000."],
    [{ price_per_hour: "1000.01" }, "Set an hourly price between £0.01 and £1,000."],
    [{ ends_on: "2026-10-30" }, "The last day has already passed."],
    [{ starts_on: "2026-11-10", ends_on: "2026-11-05" }, "The offer must end on or after the day it starts."],
  ])("refuses %j before the round trip", (over, error) => {
    const draft = { ...emptyDraft(), hours: "6", price_per_hour: "36", ...over };
    expect(promotionInputFromDraft(draft, TODAY)).toEqual({ ok: false, error });
  });
});

describe("draft and patch", () => {
  it("round-trips an offer's window into London days", () => {
    const draft = draftFromPromotion(promo({ starts_at: "2026-11-02T00:00:00.000Z", ends_at: "2026-12-01T00:00:00.000Z", price_per_hour_pence: 3650 }));
    expect(draft).toEqual({ title: "Intro offer", description: "", hours: "6", price_per_hour: "36.50", starts_on: "2026-11-02", ends_on: "2026-11-30" });
  });

  it("patches only what changed, and nothing for an untouched form", () => {
    const current = promo({ ends_at: "2026-12-01T00:00:00.000Z" });
    const unchanged = promotionInputFromDraft(draftFromPromotion(current), TODAY);
    expect(unchanged.ok && promotionPatch(current, unchanged.input)).toEqual({});

    const changed = promotionInputFromDraft({ ...draftFromPromotion(current), price_per_hour: "30", ends_on: "" }, TODAY);
    expect(changed.ok && promotionPatch(current, changed.input)).toEqual({ price_per_hour_pence: 3000, ends_at: null });
  });

  it("names the one active offer", () => {
    const ended = promo({ id: "a", active: false, live: false });
    const live = promo({ id: "b" });
    expect(currentPromotion([ended, live])).toBe(live);
    expect(currentPromotion([ended])).toBeNull();
  });
});

describe("words", () => {
  it("describes the rate", () => {
    expect(describePromotion({ hours: 6, price_per_hour_pence: 3600 })).toBe("First 6 hours at £36 an hour");
    expect(describePromotion({ hours: 1, price_per_hour_pence: 3650 })).toBe("First hour at £36.50 an hour");
  });

  it("says where the offer stands", () => {
    const now = Date.parse("2026-10-31T12:00:00.000Z");
    expect(promotionState(promo(), now)).toEqual({ label: "Live now", tone: "live" });
    expect(promotionState(promo({ ends_at: "2026-12-01T00:00:00.000Z" }), now)).toEqual({ label: "Live until 30 Nov", tone: "live" });
    expect(promotionState(promo({ starts_at: "2026-11-02T00:00:00.000Z" }), now)).toEqual({ label: "Starts 2 Nov", tone: "scheduled" });
    // Midnight London on 1 Oct is 23:00Z on 30 Sep (BST): the last day on was 30 Sep.
    expect(promotionState(promo({ ends_at: "2026-09-30T23:00:00.000Z" }), now)).toEqual({ label: "Ended 30 Sep", tone: "ended" });
    expect(promotionState(promo({ active: false, updated_at: "2026-10-20T09:00:00.000Z" }), now)).toEqual({ label: "Ended 20 Oct", tone: "ended" });
  });
});
