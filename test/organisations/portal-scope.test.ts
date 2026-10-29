import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SCHOOL = "11111111-2222-4333-8444-555555555555";
let chosen: string | null = null;

vi.mock("@/lib/organisations/supabase-server", () => ({ getOrganisationAccessToken: async () => "token" }));
vi.mock("@/lib/organisations/school", () => ({ getChosenSchool: async () => chosen }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT ${to}`);
  },
}));

async function load() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_PRODUCT_SUPABASE_URL", "https://supabase.test");
  vi.stubEnv("NEXT_PUBLIC_PRODUCT_SUPABASE_ANON_KEY", "anon");
  vi.stubEnv("NEWDRYVE_API_ORIGIN", "https://api.test");
  return import("@/lib/organisations/portal");
}

let requests: Array<{ url: string; init: RequestInit }> = [];
function respondWith(status: number, body: unknown) {
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
  chosen = null;
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("orgRead", () => {
  it("sends a super admin without a school to the picker, back to the page they wanted", async () => {
    const { orgRead } = await load();
    respondWith(422, { error: { code: "validation_failed", message: "Choose which organisation", details: { code: "organisation_required" } } });
    await expect(orgRead("/v1/organisations/me/live", { returnTo: "/organisations/live" })).rejects.toThrow(
      "REDIRECT /organisations/choose?reason=required&next=%2Forganisations%2Flive"
    );
  });

  it("scopes reads to the chosen school", async () => {
    chosen = SCHOOL;
    const { orgRead } = await load();
    respondWith(200, { ok: true });
    await orgRead("/v1/organisations/me/timesheet?week=2026-10-12");
    expect(requests[0]!.url).toBe(`https://api.test/v1/organisations/me/timesheet?week=2026-10-12&organisation_id=${SCHOOL}`);
  });

  it("takes a cancelled school to the page that says so", async () => {
    const { orgRead } = await load();
    respondWith(403, {
      error: {
        code: "forbidden",
        message: "Your school has been cancelled on Newdryve.",
        details: { code: "organisation_unavailable", organisations: [{ id: "o1", name: "Acme", status: "closed" }] },
      },
    });
    await expect(orgRead("/v1/organisations/me/live")).rejects.toThrow("REDIRECT /organisations/denied?reason=unavailable");
  });
});

describe("orgProxy", () => {
  it("adds the chosen school to a write body that names none", async () => {
    chosen = SCHOOL;
    const { orgProxy } = await load();
    respondWith(200, { items: [] });
    const request = new Request("https://newdryve.com/organisations/api/invoices/generate", {
      method: "POST",
      headers: { origin: "https://newdryve.com", host: "newdryve.com" },
      body: JSON.stringify({ week: "2026-10-12", send: true }),
    });
    const response = await orgProxy(request, "/v1/organisations/me/invoices/generate", "POST");
    expect(response.status).toBe(200);
    expect(JSON.parse(String(requests[0]!.init.body))).toEqual({ week: "2026-10-12", send: true, organisation_id: SCHOOL });
  });

  it("passes organisation_required through for the form to show", async () => {
    const { orgProxy } = await load();
    respondWith(422, { error: { code: "validation_failed", message: "Choose which organisation", details: { code: "organisation_required" } } });
    const response = await orgProxy(new Request("https://newdryve.com/x"), "/v1/organisations/me/cancellation-policy", "GET");
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: "Choose which organisation", code: "organisation_required" });
  });
});
