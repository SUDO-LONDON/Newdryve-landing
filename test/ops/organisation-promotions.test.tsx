import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Promotion } from "@/lib/organisations/promotions";
import { opsOrganisation } from "../fixtures";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const { default: OrganisationDetailClient } = await import("@/components/ops/OrganisationDetailClient");

const ORG = "11111111-2222-4333-8444-555555555555";
const PROMO = "22222222-3333-4444-8555-666666666666";

function promo(over: Partial<Promotion> = {}): Promotion {
  return {
    id: PROMO,
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
    updated_by: "newdryve",
    updated_by_email: "founder@newdryve.com",
    created_at: "2026-10-31T10:00:00.000Z",
    updated_at: "2026-10-31T10:00:00.000Z",
    ...over,
  };
}

type Call = { url: string; method: string; body: Record<string, unknown> | null };

function stubFetch(respond: (call: Call) => { status: number; body: unknown }) {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const call = { url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : null };
      calls.push(call);
      const { status, body } = respond(call);
      return new Response(JSON.stringify(body), { status });
    })
  );
  return calls;
}

beforeEach(() => {
  refresh.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("ops organisation intro offer", () => {
  it("is not shown when the page did not ask for the offers", () => {
    render(<OrganisationDetailClient organisation={opsOrganisation()} />);
    expect(screen.queryByRole("heading", { name: "Intro offer" })).toBeNull();
  });

  it("starts an offer through the ops route with the strict body, never naming the school", async () => {
    const calls = stubFetch(() => ({ status: 201, body: { promotion: promo() } }));
    render(<OrganisationDetailClient organisation={opsOrganisation()} promotions={[]} promotionsError={null} />);
    expect(screen.getByRole("heading", { name: "Intro offer" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Hours covered"), { target: { value: "6" } });
    fireEvent.change(screen.getByLabelText("Price per hour (£)"), { target: { value: "36" } });
    fireEvent.click(screen.getByRole("button", { name: "Start intro offer" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("The offer is live."));
    expect(calls).toEqual([
      {
        url: `/ops/api/organisations/${ORG}/promotions`,
        method: "POST",
        body: {
          kind: "intro_rate",
          title: "Intro offer",
          description: null,
          hours: 6,
          price_per_hour_pence: 3600,
          active: true,
          starts_at: null,
          ends_at: null,
        },
      },
    ]);
    expect(screen.getByText(/set by founder@newdryve.com/)).toBeTruthy();
  });

  it("ends an offer through the ops route", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { promotion: promo({ active: false, live: false }) } }));
    vi.stubGlobal("confirm", vi.fn(() => true));
    render(<OrganisationDetailClient organisation={opsOrganisation()} promotions={[promo()]} />);
    fireEvent.click(screen.getByRole("button", { name: "End offer" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Offer ended."));
    expect(calls).toEqual([{ url: `/ops/api/organisations/${ORG}/promotions/${PROMO}`, method: "PATCH", body: { active: false } }]);
  });

  it("says when the offers could not be read and will not write", () => {
    render(<OrganisationDetailClient organisation={opsOrganisation()} promotions={null} promotionsError="Could not reach the Newdryve API." />);
    expect(screen.getByRole("alert").textContent).toBe("Could not reach the Newdryve API.");
    expect((screen.getByRole("button", { name: "Start intro offer" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("ops promotions API client", () => {
  async function load() {
    vi.resetModules();
    vi.stubEnv("NEWDRYVE_API_ORIGIN", "https://api.test");
    vi.stubEnv("NEWDRYVE_API_OPS_SECRET", "secret");
    return import("@/lib/ops/organisations");
  }

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

  it("lists, starts and changes a school's offers with the ops headers", async () => {
    const { listOrganisationPromotions, createOrganisationPromotion, updateOrganisationPromotion } = await load();

    respondWith(200, { organisation_id: ORG, promotions: [promo()] });
    expect(await listOrganisationPromotions(ORG, "founder@newdryve.com")).toEqual([promo()]);
    expect(requests[0]!.url).toBe(`https://api.test/v1/ops/organisations/${ORG}/promotions`);
    expect((requests[0]!.init.headers as Record<string, string>)["x-ops-founder-email"]).toBe("founder@newdryve.com");
    expect((requests[0]!.init.headers as Record<string, string>)["x-ops-secret"]).toBe("secret");

    respondWith(201, { promotion: promo() });
    const input = { kind: "intro_rate" as const, title: "Intro offer", description: null, hours: 6, price_per_hour_pence: 3600, active: true, starts_at: null, ends_at: null };
    expect(await createOrganisationPromotion(ORG, input, "founder@newdryve.com")).toEqual(promo());
    expect(requests[0]!.init.method).toBe("POST");
    expect(JSON.parse(String(requests[0]!.init.body))).toEqual(input);

    respondWith(200, { promotion: promo({ active: false }) });
    expect(await updateOrganisationPromotion(ORG, PROMO, { active: false }, "founder@newdryve.com")).toEqual(promo({ active: false }));
    expect(requests[0]!.url).toBe(`https://api.test/v1/ops/organisations/${ORG}/promotions/${PROMO}`);
    expect(requests[0]!.init.method).toBe("PATCH");
    expect(JSON.parse(String(requests[0]!.init.body))).toEqual({ active: false });
  });

  it("passes the API's refusal back with its code", async () => {
    const { createOrganisationPromotion, OrganisationApiError } = await load();
    respondWith(409, { error: { message: "This school already has an active intro offer.", details: { code: "promotion_already_active" } } });
    const input = { kind: "intro_rate" as const, title: "Intro offer", description: null, hours: 6, price_per_hour_pence: 3600, active: true, starts_at: null, ends_at: null };
    await expect(createOrganisationPromotion(ORG, input, "founder@newdryve.com")).rejects.toMatchObject({
      message: "This school already has an active intro offer.",
      status: 409,
      code: "promotion_already_active",
    });
    await expect(createOrganisationPromotion(ORG, input, "founder@newdryve.com")).rejects.toBeInstanceOf(OrganisationApiError);
  });
});
