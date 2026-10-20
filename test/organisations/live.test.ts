import { describe, expect, it } from "vitest";
import { readableBlockLabel, readableLive, readableStatusDetail } from "@/lib/organisations/live";
import type { LiveResponse } from "@/lib/organisations/types";
import { liveInstructor } from "../fixtures";

describe("live board wording", () => {
  it("labels sick-day blocks Off sick and leaves other labels", () => {
    expect(readableBlockLabel("sick_day")).toBe("Off sick");
    expect(readableBlockLabel("Personal time")).toBe("Personal time");
    expect(readableBlockLabel("  ")).toBe("Blocked out");
  });

  it("rewords an older API's raw status detail", () => {
    expect(readableStatusDetail("sick_day until 17:00")).toBe("Off sick until 17:00");
    expect(readableStatusDetail("Off sick until 17:00")).toBe("Off sick until 17:00");
    expect(readableStatusDetail("sick_days_off")).toBe("sick_days_off");
    expect(readableStatusDetail(null)).toBeNull();
  });

  it("rewrites a whole response without touching the rest", () => {
    const live: LiveResponse = { generated_at: "2026-10-20T10:00:00.000Z", date: "2026-10-20", organisations: [], instructors: [liveInstructor()] };
    const out = readableLive(live);
    expect(out.instructors[0]!.blocks_today[0]!.label).toBe("Off sick");
    expect(out.instructors[0]!.status.detail).toBe("Off sick until 17:00");
    expect(live.instructors[0]!.blocks_today[0]!.label).toBe("sick_day");
  });
});
