import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function load() {
  vi.resetModules();
  vi.stubEnv("NEWDRYVE_API_ORIGIN", "https://api.test");
  vi.stubEnv("NEWDRYVE_API_OPS_SECRET", "secret");
  return import("@/lib/ops/organisations");
}

const backendOrg = (members: Record<string, unknown>[]) => ({
  id: "o1",
  name: "Acme",
  legal_name: null,
  contact_name: null,
  contact_email: null,
  contact_phone: null,
  status: "active",
  join_code_last4: "1234",
  created_at: "2026-09-01T00:00:00.000Z",
  members,
});

const backendMember = (extra: Record<string, unknown> = {}) => ({
  membership_id: "m1",
  instructor_id: "i1",
  name: "Sam",
  email: null,
  phone: null,
  status: "active",
  is_listed: true,
  linked_at: "2026-09-02T00:00:00.000Z",
  in_lesson: false,
  current_lesson_id: null,
  completed_lessons: 3,
  revenue_pence: 9000,
  ...extra,
});

let requests: Array<{ url: string; init: RequestInit }> = [];
function respondWith(status: number, body: unknown) {
  requests = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      requests.push({ url, init });
      return new Response(JSON.stringify(body), { status });
    })
  );
}

beforeEach(() => {
  requests = [];
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("member 90-day counts", () => {
  it("keeps late_instructor_cancellations_90d and sick_days_90d, which the mapper used to drop", async () => {
    const { mapOrganisationResponse } = await load();
    const org = mapOrganisationResponse(
      backendOrg([backendMember({ late_instructor_cancellations_90d: 3, sick_days_90d: 2 })]) as never
    );
    expect(org.members[0]).toMatchObject({ late_instructor_cancellations_90d: 3, sick_days_90d: 2 });
  });

  it("maps a missing count to null, not zero", async () => {
    const { mapOrganisationResponse } = await load();
    const org = mapOrganisationResponse(backendOrg([backendMember()]) as never);
    expect(org.members[0]).toMatchObject({ late_instructor_cancellations_90d: null, sick_days_90d: null });
  });
});

describe("member seat (Newdryve ADR-060)", () => {
  it("keeps a paused seat's end date and who paused it, and an older API's missing seat as null", async () => {
    const { mapOrganisationResponse } = await load();
    const paused = mapOrganisationResponse(
      backendOrg([backendMember({ seat: { status: "paused", paused_from: "2026-10-20T09:00:00.000Z", paused_until: "2026-11-20T09:00:00.000Z", paused_by: "organisation_admin", paid_by: "organisation" } })]) as never
    );
    expect(paused.members[0]!.seat).toEqual({ status: "paused", paused_until: "2026-11-20T09:00:00.000Z", paused_by: "organisation_admin" });
    const active = mapOrganisationResponse(backendOrg([backendMember({ seat: { status: "active", paused_until: null, paused_by: null } })]) as never);
    expect(active.members[0]!.seat).toEqual({ status: "active", paused_until: null, paused_by: null });
    expect(mapOrganisationResponse(backendOrg([backendMember()]) as never).members[0]!.seat).toBeNull();
  });
});

describe("createOrganisationAdmin", () => {
  it("leaves a blank password out and reports an existing login", async () => {
    const { createOrganisationAdmin } = await load();
    respondWith(201, { admin: { id: "a1" }, existing_login: true });
    const result = await createOrganisationAdmin("o1", { email: " ana@acme.test ", password: "", display_name: "" }, "founder@newdryve.com");
    expect(result).toEqual({ existing_login: true });
    expect(requests[0]!.url).toBe("https://api.test/v1/ops/organisations/o1/admins");
    expect(JSON.parse(String(requests[0]!.init.body))).toEqual({ email: "ana@acme.test", display_name: null });
  });

  it("treats an older API's answer as a new login", async () => {
    const { createOrganisationAdmin } = await load();
    respondWith(201, { admin: { id: "a1" } });
    expect(await createOrganisationAdmin("o1", { email: "a@b.test", password: "longenough1" }, "f")).toEqual({ existing_login: false });
    expect(JSON.parse(String(requests[0]!.init.body)).password).toBe("longenough1");
  });

  it("carries the API's code for the form to word", async () => {
    const { createOrganisationAdmin, OrganisationApiError } = await load();
    respondWith(409, { error: { code: "conflict", message: "That email already has an account", details: { code: "email_in_use" } } });
    const failure = await createOrganisationAdmin("o1", { email: "a@b.test" }, "f").catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(OrganisationApiError);
    expect(failure).toMatchObject({ status: 409, code: "email_in_use" });
  });
});
