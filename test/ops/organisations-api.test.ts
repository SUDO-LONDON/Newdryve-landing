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

describe("school admin logins (Newdryve ADR-060)", () => {
  it("lists them, revoked ones marked as revoked", async () => {
    const { listOrganisationAdmins } = await load();
    respondWith(200, {
      admins: [
        { id: "a2", organisation_id: "o1", profile_id: "p2", email: "office@acme.test", display_name: null, status: "active", created_at: "2026-10-01T00:00:00Z", revoked_at: null },
        { id: "a1", organisation_id: "o1", profile_id: "p1", email: "old@acme.test", display_name: "Old", status: "revoked", created_at: "2026-09-01T00:00:00Z", revoked_at: "2026-10-20T09:00:00Z" },
      ],
    });
    expect(await listOrganisationAdmins("o1", "founder@newdryve.com")).toEqual([
      { id: "a2", email: "office@acme.test", display_name: null, status: "active", created_at: "2026-10-01T00:00:00Z", revoked_at: null },
      { id: "a1", email: "old@acme.test", display_name: "Old", status: "revoked", created_at: "2026-09-01T00:00:00Z", revoked_at: "2026-10-20T09:00:00Z" },
    ]);
    expect(requests[0]!.url).toBe("https://api.test/v1/ops/organisations/o1/admins");
    expect((requests[0]!.init.headers as Record<string, string>)["x-ops-founder-email"]).toBe("founder@newdryve.com");
  });

  it("answers null while the API has no list route", async () => {
    const { listOrganisationAdmins } = await load();
    respondWith(404, { error: { code: "not_found", message: "Route GET:/v1/ops/organisations/o1/admins not found" } });
    expect(await listOrganisationAdmins("o1", "f")).toBeNull();
  });

  it("revokes with a bodyless DELETE and reports a repeat", async () => {
    const { revokeOrganisationAdmin } = await load();
    respondWith(200, { revoked: true, already_revoked: true, admin: { id: "a1", status: "revoked", revoked_at: "2026-10-20T09:00:00Z" } });
    expect(await revokeOrganisationAdmin("o1", "a1", "f")).toEqual({ already_revoked: true, revoked_at: "2026-10-20T09:00:00Z" });
    expect(requests[0]!.url).toBe("https://api.test/v1/ops/organisations/o1/admins/a1");
    expect(requests[0]!.init.method).toBe("DELETE");
    expect(requests[0]!.init.body).toBeUndefined();
    expect((requests[0]!.init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("carries the API's admin_not_found for another school's admin", async () => {
    const { revokeOrganisationAdmin } = await load();
    respondWith(404, { error: { code: "not_found", message: "That admin login is not linked to this organisation", details: { code: "admin_not_found" } } });
    await expect(revokeOrganisationAdmin("o1", "a9", "f")).rejects.toMatchObject({ status: 404, code: "admin_not_found" });
  });
});
