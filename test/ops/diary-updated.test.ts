import { describe, expect, it } from "vitest";
import { diaryUpdatedLabel } from "@/lib/ops/types";

describe("diaryUpdatedLabel", () => {
  const now = new Date("2026-10-20T10:00:00.000Z");
  it("reads in London days", () => {
    expect(diaryUpdatedLabel({ assistant_linked: true, last_diary_activity_at: "2026-10-20T07:00:00.000Z" }, now)).toBe("Today");
    // 23:30 UTC on the 18th is 00:30 on the 19th in London (BST): yesterday.
    expect(diaryUpdatedLabel({ assistant_linked: false, last_diary_activity_at: "2026-10-18T23:30:00.000Z" }, now)).toBe("Yesterday");
    expect(diaryUpdatedLabel({ assistant_linked: false, last_diary_activity_at: "2026-10-16T09:00:00.000Z" }, now)).toBe("4 days ago");
    expect(diaryUpdatedLabel({ assistant_linked: false, last_diary_activity_at: "2026-09-01T09:00:00.000Z" }, now)).toBe("Over 2 weeks ago");
  });

  it("never reads a missing signal as a fresh diary", () => {
    expect(diaryUpdatedLabel({ assistant_linked: false, last_diary_activity_at: null }, now)).toBe("No changes yet");
    expect(diaryUpdatedLabel({ assistant_linked: null, last_diary_activity_at: null }, now)).toBe("Not available");
  });
});
