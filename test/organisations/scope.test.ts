import { describe, expect, it } from "vitest";
import {
  isOrganisationRequired,
  portalReadOutcome,
  safePortalNext,
  withSchool,
  withSchoolBody,
} from "@/lib/organisations/scope";

const SCHOOL = "11111111-2222-4333-8444-555555555555";
const OTHER = "99999999-2222-4333-8444-555555555555";

describe("withSchool", () => {
  it("adds the chosen school to a path with or without a query", () => {
    expect(withSchool("/v1/organisations/me/live", SCHOOL)).toBe(`/v1/organisations/me/live?organisation_id=${SCHOOL}`);
    expect(withSchool("/v1/organisations/me/timesheet?week=2026-10-12", SCHOOL)).toBe(
      `/v1/organisations/me/timesheet?week=2026-10-12&organisation_id=${SCHOOL}`
    );
  });

  it("keeps a school the path already names, and does nothing without a valid choice", () => {
    expect(withSchool(`/x?organisation_id=${OTHER}`, SCHOOL)).toBe(`/x?organisation_id=${OTHER}`);
    expect(withSchool("/x", null)).toBe("/x");
    expect(withSchool("/x", "not-a-uuid")).toBe("/x");
  });
});

describe("withSchoolBody", () => {
  it("adds organisation_id to a JSON object that names none", () => {
    expect(JSON.parse(withSchoolBody(JSON.stringify({ week: "2026-10-12", send: true }), SCHOOL))).toEqual({
      week: "2026-10-12",
      send: true,
      organisation_id: SCHOOL,
    });
  });

  it("leaves a named school, an empty body, arrays and non-JSON alone", () => {
    const named = JSON.stringify({ organisation_id: OTHER, notice_hours: 24 });
    expect(withSchoolBody(named, SCHOOL)).toBe(named);
    expect(withSchoolBody("", SCHOOL)).toBe("");
    expect(withSchoolBody("[1]", SCHOOL)).toBe("[1]");
    expect(withSchoolBody("nope", SCHOOL)).toBe("nope");
    expect(withSchoolBody('{"a":1}', null)).toBe('{"a":1}');
  });
});

describe("isOrganisationRequired", () => {
  it("recognises the #511 code and the older super-admin message", () => {
    expect(isOrganisationRequired(422, "organisation_required")).toBe(true);
    expect(isOrganisationRequired(422, "validation_failed", "organisation_id is required")).toBe(true);
    expect(isOrganisationRequired(422, "validation_failed", "Choose a notice period")).toBe(false);
    expect(isOrganisationRequired(403, "organisation_required")).toBe(false);
  });
});

describe("safePortalNext", () => {
  it("only returns to portal pages", () => {
    expect(safePortalNext("/organisations/live")).toBe("/organisations/live");
    expect(safePortalNext("https://evil.example/organisations")).toBe("/organisations");
    expect(safePortalNext("//evil.example")).toBe("/organisations");
    expect(safePortalNext("/organisations/auth/signout")).toBe("/organisations");
    expect(safePortalNext("/organisations/choose")).toBe("/organisations");
    expect(safePortalNext(null)).toBe("/organisations");
  });
});

describe("portalReadOutcome", () => {
  const err = (code: string | null, message = "x") => ({ code, message });

  it("sends a super admin with no school to the picker instead of an error page", () => {
    expect(portalReadOutcome(422, err("organisation_required"), null)).toEqual({ kind: "choose", reason: "required" });
  });

  it("says a cancelled school is unavailable rather than denying access", () => {
    expect(portalReadOutcome(403, err("organisation_unavailable"), null)).toEqual({ kind: "denied", reason: "unavailable" });
    expect(portalReadOutcome(403, err("organisation_unavailable"), SCHOOL)).toEqual({ kind: "denied", reason: "unavailable" });
  });

  it("asks again when the chosen school is refused, and denies otherwise", () => {
    expect(portalReadOutcome(403, err("forbidden"), SCHOOL)).toEqual({ kind: "choose", reason: "stale" });
    expect(portalReadOutcome(403, err("forbidden"), null)).toEqual({ kind: "denied", reason: null });
  });

  it("passes success, sign-in and other failures through", () => {
    expect(portalReadOutcome(200, err(null), null)).toEqual({ kind: "ok" });
    expect(portalReadOutcome(401, err(null), SCHOOL)).toEqual({ kind: "login" });
    expect(portalReadOutcome(500, err(null, "Boom"), null)).toEqual({ kind: "error", message: "Boom" });
  });
});
