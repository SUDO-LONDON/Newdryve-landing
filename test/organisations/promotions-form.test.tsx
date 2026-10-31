import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PromotionsForm from "@/components/organisations/PromotionsForm";
import type { Promotion } from "@/lib/organisations/promotions";

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
    updated_by: "school",
    updated_by_email: "ana@acme.test",
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

const field = (name: string) => screen.getByLabelText(name) as HTMLInputElement;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PromotionsForm (school portal)", () => {
  it("starts an offer, naming the school, and shows it as current", async () => {
    const calls = stubFetch(() => ({ status: 201, body: { promotion: promo() } }));
    render(<PromotionsForm schools={[{ id: ORG, name: "Acme", promotions: [] }]} />);
    expect(screen.getByText(/No intro offer at the moment/)).toBeTruthy();

    fireEvent.change(field("Hours covered"), { target: { value: "6" } });
    fireEvent.change(field("Price per hour (£)"), { target: { value: "36" } });
    expect(screen.getByText(/First 6 hours at £36 an hour for each learner/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start intro offer" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("The offer is live."));
    expect(calls).toEqual([
      {
        url: "/organisations/api/promotions",
        method: "POST",
        body: {
          organisation_id: ORG,
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
    expect(screen.getByText("Current offer")).toBeTruthy();
    expect(screen.getByText("Intro offer · First 6 hours at £36 an hour")).toBeTruthy();
    expect(screen.getByText("Live now")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
  });

  it("sends a last day as the end of that London day", async () => {
    const calls = stubFetch(() => ({ status: 201, body: { promotion: promo({ ends_at: "2099-12-01T00:00:00.000Z" }) } }));
    render(<PromotionsForm schools={[{ id: ORG, name: "Acme", promotions: [] }]} />);
    fireEvent.change(field("Hours covered"), { target: { value: "6" } });
    fireEvent.change(field("Price per hour (£)"), { target: { value: "36" } });
    fireEvent.change(field("Last day (optional)"), { target: { value: "2099-11-30" } });
    fireEvent.click(screen.getByRole("button", { name: "Start intro offer" }));
    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
    expect(calls[0]!.body!.ends_at).toBe("2099-12-01T00:00:00.000Z");
    expect(screen.getByText("Live until 30 Nov")).toBeTruthy();
  });

  it("edits the current offer with only the changed fields", async () => {
    const calls = stubFetch((call) => ({ status: 200, body: { promotion: promo({ price_per_hour_pence: Number(call.body!.price_per_hour_pence) }) } }));
    render(<PromotionsForm schools={[{ id: ORG, name: "Acme", promotions: [promo()] }]} />);
    expect(field("Price per hour (£)").value).toBe("36");

    fireEvent.change(field("Price per hour (£)"), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Saved."));
    expect(calls).toEqual([
      { url: `/organisations/api/promotions/${PROMO}`, method: "PATCH", body: { organisation_id: ORG, price_per_hour_pence: 3000 } },
    ]);
    expect(screen.getByText("Intro offer · First 6 hours at £30 an hour")).toBeTruthy();
  });

  it("does not write an unchanged offer", async () => {
    const calls = stubFetch(() => ({ status: 200, body: {} }));
    render(<PromotionsForm schools={[{ id: ORG, name: "Acme", promotions: [promo()] }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Nothing has changed."));
    expect(calls).toEqual([]);
  });

  it("ends the offer after a confirmation and lists it as past", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { promotion: promo({ active: false, live: false, updated_at: "2026-11-05T09:00:00.000Z" }) } }));
    vi.stubGlobal("confirm", vi.fn(() => true));
    render(<PromotionsForm schools={[{ id: ORG, name: "Acme", promotions: [promo()] }]} />);
    fireEvent.click(screen.getByRole("button", { name: "End offer" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Offer ended."));
    expect(calls).toEqual([{ url: `/organisations/api/promotions/${PROMO}`, method: "PATCH", body: { organisation_id: ORG, active: false } }]);
    expect(screen.getByText("Past offers")).toBeTruthy();
    expect(screen.getByText("Intro offer · First 6 hours at £36 an hour · Ended 5 Nov")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start intro offer" })).toBeTruthy();
  });

  it("keeps the offer when the confirmation is declined", () => {
    const calls = stubFetch(() => ({ status: 200, body: {} }));
    vi.stubGlobal("confirm", vi.fn(() => false));
    render(<PromotionsForm schools={[{ id: ORG, name: "Acme", promotions: [promo()] }]} />);
    fireEvent.click(screen.getByRole("button", { name: "End offer" }));
    expect(calls).toEqual([]);
    expect(screen.getByText("Live now")).toBeTruthy();
  });

  it("shows the API's refusal", async () => {
    stubFetch(() => ({
      status: 409,
      body: { error: "This school already has an active intro offer. End it before starting another.", code: "promotion_already_active" },
    }));
    render(<PromotionsForm schools={[{ id: ORG, name: "Acme", promotions: [] }]} />);
    fireEvent.change(field("Hours covered"), { target: { value: "6" } });
    fireEvent.change(field("Price per hour (£)"), { target: { value: "36" } });
    fireEvent.click(screen.getByRole("button", { name: "Start intro offer" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("already has an active intro offer"));
  });

  it("will not write when the offers could not be read", () => {
    render(<PromotionsForm schools={[{ id: ORG, name: "Acme", promotions: null, error: "Could not reach Newdryve." }]} />);
    expect(screen.getByRole("alert").textContent).toBe("Could not reach Newdryve.");
    expect((screen.getByRole("button", { name: "Start intro offer" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("names each school for an admin of several", () => {
    render(
      <PromotionsForm
        schools={[
          { id: ORG, name: "Acme", promotions: [] },
          { id: "33333333-2222-4333-8444-555555555555", name: "Beta", promotions: [promo({ id: "x", organisation_id: "33333333-2222-4333-8444-555555555555" })] },
        ]}
      />
    );
    expect(screen.getByRole("heading", { name: "Acme" })).toBeTruthy();
    expect(screen.getByRole("form", { name: "Intro offer for Beta" })).toBeTruthy();
  });
});
