import { describe, expect, it } from "vitest";
import { readUnavailable, unavailableNotice } from "@/lib/organisations/unavailable";

// A school is active or cancelled (`closed`); it is never paused (Newdryve ADR-060).
describe("readUnavailable", () => {
  it("keeps well-formed cancelled schools only", () => {
    expect(
      readUnavailable([
        { id: "a", name: "Acme", status: "paused" },
        { id: "b", name: "", status: "closed" },
        { id: "c", name: "Live", status: "active" },
        null,
        "x",
      ])
    ).toEqual([{ id: "b", name: "Your school", status: "closed" }]);
    expect(readUnavailable(undefined)).toEqual([]);
  });
});

describe("unavailableNotice", () => {
  it("says a single school has been cancelled and its seats ended", () => {
    const notice = unavailableNotice([{ id: "a", name: "Acme Driving", status: "closed" }]);
    expect(notice?.title).toBe("This school has been cancelled");
    expect(notice?.body).toContain("Acme Driving has been cancelled on Newdryve");
    expect(notice?.body).toContain("seats have ended");
    expect(notice?.body).not.toMatch(/paused/i);
  });

  it("names each school when there are several", () => {
    const notice = unavailableNotice([
      { id: "a", name: "Acme", status: "closed" },
      { id: "b", name: "Beta", status: "closed" },
    ]);
    expect(notice?.title).toBe("These schools have been cancelled");
    expect(notice?.body).toContain("Cancelled on Newdryve: Acme, Beta.");
  });

  it("is nothing when every school is available", () => {
    expect(unavailableNotice([])).toBeNull();
  });
});
