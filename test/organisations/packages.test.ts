import { describe, expect, it } from "vitest";
import {
  adjustmentFromText,
  describePackage,
  draftFromPackage,
  emptyPackageDraft,
  hoursText,
  minutesFromHours,
  packageInputFromDraft,
  packagePatch,
  packagesByCategory,
  type PackageDraft,
  type SchoolPackage,
} from "@/lib/organisations/packages";

function pkg(over: Partial<SchoolPackage> = {}): SchoolPackage {
  return {
    id: "22222222-3333-4444-8555-666666666666",
    category: "weekly_manual",
    category_label: "Weekly manual",
    name: "10 hours intro daytime",
    minutes: 600,
    hours_label: "10 hours",
    transmission: "manual",
    lesson_times: ["weekday_daytime"],
    lesson_times_label: "weekday daytimes",
    price_pence: 43000,
    valid_months: 12,
    is_active: true,
    sort_order: 0,
    ...over,
  };
}
const draft = (over: Partial<PackageDraft> = {}): PackageDraft => ({ ...emptyPackageDraft(), name: "10 hours intro daytime", hours: "10", ...over });

describe("hours as a school types them", () => {
  it("reads whole and part hours, and refuses anything that is not a whole number of minutes", () => {
    expect(minutesFromHours("10")).toBe(600);
    expect(minutesFromHours("4.5")).toBe(270);
    expect(minutesFromHours("4½")).toBe(270);
    expect(minutesFromHours("1.25 hours")).toBe(75);
    expect(minutesFromHours("-4")).toBe(-240);
    expect(minutesFromHours("ten")).toBeNull();
    expect(minutesFromHours("1.01")).toBeNull();
    expect(minutesFromHours("")).toBeNull();
    expect(hoursText(270)).toBe("4.5");
    expect(hoursText(600)).toBe("10");
  });
});

describe("a package from the form", () => {
  it("becomes what the API takes, with times in a fixed order and an empty price as none", () => {
    const checked = packageInputFromDraft(draft({ transmission: "manual", lesson_times: ["weekend", "weekday_daytime"], price: "" }));
    expect(checked).toEqual({
      ok: true,
      input: { category: "weekly_manual", name: "10 hours intro daytime", minutes: 600, transmission: "manual", lesson_times: ["weekday_daytime", "weekend"], price_pence: null, valid_months: 12 },
    });
    const priced = packageInputFromDraft(draft({ price: "£430", transmission: "", lesson_times: [] }));
    expect(priced.ok && priced.input).toMatchObject({ price_pence: 43000, transmission: null, lesson_times: [] });
  });

  it("says what is wrong before anything is sent", () => {
    const error = (over: Partial<PackageDraft>) => {
      const checked = packageInputFromDraft(draft(over));
      return checked.ok ? null : checked.error;
    };
    expect(error({ name: "  " })).toMatch(/Give the package a name/);
    expect(error({ name: "x".repeat(61) })).toMatch(/60 characters/);
    expect(error({ hours: "" })).toMatch(/how many hours/);
    expect(error({ hours: "0.25" })).toMatch(/how many hours/);
    expect(error({ hours: "1001" })).toMatch(/how many hours/);
    expect(error({ price: "four hundred" })).toMatch(/price in pounds/);
    expect(error({ valid_months: "0" })).toMatch(/how many months/);
    expect(error({ valid_months: "1.5" })).toMatch(/how many months/);
  });

  it("round-trips a saved package, and patches only what changed", () => {
    const saved = pkg();
    const same = packageInputFromDraft(draftFromPackage(saved));
    expect(same.ok && packagePatch(saved, same.input)).toEqual({});
    const changed = packageInputFromDraft({ ...draftFromPackage(saved), hours: "12", lesson_times: [], price: "" });
    expect(changed.ok && packagePatch(saved, changed.input)).toEqual({ minutes: 720, lesson_times: [], price_pence: null });
  });
});

describe("the list", () => {
  it("is grouped by kind in the order the chat asks, with empty kinds left out", () => {
    const groups = packagesByCategory([pkg({ id: "t", category: "towing", name: "Towing day" }), pkg(), pkg({ id: "m2", name: "10 hours evening" })]);
    expect(groups.map((g) => [g.label, g.packages.map((p) => p.name)])).toEqual([
      ["Weekly manual", ["10 hours intro daytime", "10 hours evening"]],
      ["Towing", ["Towing day"]],
    ]);
  });

  it("describes a package in one line", () => {
    expect(describePackage(pkg())).toBe("10 hours · manual · weekday daytimes · lasts 12 months");
    expect(describePackage(pkg({ transmission: null, lesson_times_label: null, valid_months: 1, hours_label: "4½ hours" }))).toBe("4½ hours · any car · any time · lasts 1 month");
  });
});

describe("a correction to a learner's hours", () => {
  it("is typed in hours, minus for hours already used", () => {
    expect(adjustmentFromText("-4")).toEqual({ ok: true, minutes: -240 });
    expect(adjustmentFromText("+1.5")).toEqual({ ok: true, minutes: 90 });
    expect(adjustmentFromText("")).toEqual({ ok: true, minutes: 0 });
    expect(adjustmentFromText("four").ok).toBe(false);
    expect(adjustmentFromText("5000").ok).toBe(false);
  });
});
