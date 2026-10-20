import { describe, expect, it } from "vitest";
import { readUnavailable, unavailableNotice } from "@/lib/organisations/unavailable";

describe("readUnavailable", () => {
  it("keeps well-formed paused and closed schools only", () => {
    expect(
      readUnavailable([
        { id: "a", name: "Acme", status: "paused" },
        { id: "b", name: "", status: "closed" },
        { id: "c", name: "Live", status: "active" },
        null,
        "x",
      ])
    ).toEqual([
      { id: "a", name: "Acme", status: "paused" },
      { id: "b", name: "Your school", status: "closed" },
    ]);
    expect(readUnavailable(undefined)).toEqual([]);
  });
});

describe("unavailableNotice", () => {
  it("says a single school is paused by Newdryve", () => {
    const notice = unavailableNotice([{ id: "a", name: "Acme Driving", status: "paused" }]);
    expect(notice?.title).toBe("This school is paused by Newdryve");
    expect(notice?.body).toContain("Acme Driving is paused");
  });

  it("says a single school is closed", () => {
    expect(unavailableNotice([{ id: "a", name: "Acme", status: "closed" }])?.title).toBe("This school is closed");
  });

  it("names each school when there are several", () => {
    const notice = unavailableNotice([
      { id: "a", name: "Acme", status: "paused" },
      { id: "b", name: "Beta", status: "closed" },
    ]);
    expect(notice?.title).toBe("These schools are paused or closed");
    expect(notice?.body).toContain("Paused by Newdryve: Acme.");
    expect(notice?.body).toContain("Closed: Beta.");
  });

  it("is nothing when every school is available", () => {
    expect(unavailableNotice([])).toBeNull();
  });
});
