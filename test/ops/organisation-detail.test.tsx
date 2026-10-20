import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { opsOrganisation } from "../fixtures";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const { default: OrganisationDetailClient } = await import("@/components/ops/OrganisationDetailClient");

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

function adminForm() {
  return {
    email: screen.getByLabelText("Admin email") as HTMLInputElement,
    password: screen.getByLabelText("Temporary password") as HTMLInputElement,
    submit: screen.getByRole("button", { name: "Create admin login" }),
  };
}

beforeEach(() => {
  refresh.mockReset();
  vi.unstubAllGlobals();
});

describe("ops organisation admin login", () => {
  it("adds the school to an existing login with no password, then re-reads the page", async () => {
    const calls = stubFetch(() => ({ status: 201, body: { ok: true, existing_login: true } }));
    render(<OrganisationDetailClient organisation={opsOrganisation()} />);
    expect(screen.getByText(/No one can sign in to this organisation yet/)).toBeTruthy();

    const form = adminForm();
    expect(form.password.required).toBe(false);
    fireEvent.change(form.email, { target: { value: "ana@other-school.test" } });
    fireEvent.click(form.submit);

    await waitFor(() => expect(screen.getByText(/already had a school admin login/)).toBeTruthy());
    expect(calls[0]).toEqual({
      url: "/ops/api/organisations/11111111-2222-4333-8444-555555555555/admins",
      method: "POST",
      body: { email: "ana@other-school.test", display_name: null },
    });
    // The banner is server-rendered from admin_count: refreshing re-reads it.
    expect(refresh).toHaveBeenCalled();
  });

  it("asks for a password when the email is a new login", async () => {
    stubFetch(() => ({
      status: 422,
      body: { error: "Set a password for the new login", code: "password_required" },
    }));
    render(<OrganisationDetailClient organisation={opsOrganisation()} />);
    const form = adminForm();
    fireEvent.change(form.email, { target: { value: "new@acme.test" } });
    fireEvent.click(form.submit);
    await waitFor(() => expect(screen.getByText("That email has no login yet. Set a temporary password to create one.")).toBeTruthy());
    expect(refresh).not.toHaveBeenCalled();
  });

  it("sends the password for a new login and refreshes", async () => {
    const calls = stubFetch(() => ({ status: 201, body: { ok: true, existing_login: false } }));
    render(<OrganisationDetailClient organisation={opsOrganisation()} />);
    const form = adminForm();
    fireEvent.change(form.email, { target: { value: "new@acme.test" } });
    fireEvent.change(form.password, { target: { value: "longenough1" } });
    fireEvent.click(form.submit);
    await waitFor(() => expect(screen.getByText("Organisation admin login created.")).toBeTruthy());
    expect(calls[0]!.body).toEqual({ email: "new@acme.test", display_name: null, password: "longenough1" });
    expect(refresh).toHaveBeenCalled();
  });
});

describe("ops organisation status and details", () => {
  it("pauses the school after confirming", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const calls = stubFetch(() => ({ status: 200, body: { organisation: { status: "paused" } } }));
    render(<OrganisationDetailClient organisation={opsOrganisation()} />);
    expect(screen.queryByRole("button", { name: "Reactivate" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    await waitFor(() => expect(screen.getByText("Acme Driving is paused.")).toBeTruthy());
    expect(confirm.mock.calls[0]![0]).toContain("paused by Newdryve");
    expect(calls[0]).toMatchObject({ method: "PATCH", url: "/ops/api/organisations/11111111-2222-4333-8444-555555555555", body: { status: "paused" } });
    expect(refresh).toHaveBeenCalled();
  });

  it("does nothing when the change is not confirmed", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const calls = stubFetch(() => ({ status: 200, body: {} }));
    render(<OrganisationDetailClient organisation={opsOrganisation()} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(calls).toHaveLength(0);
  });

  it("offers reactivation for a paused school", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const calls = stubFetch(() => ({ status: 200, body: {} }));
    render(<OrganisationDetailClient organisation={opsOrganisation({ status: "paused" })} />);
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reactivate" }));
    await waitFor(() => expect(calls[0]?.body).toEqual({ status: "active" }));
  });

  it("saves name, legal name and contacts, blank fields as null", async () => {
    const calls = stubFetch(() => ({ status: 200, body: {} }));
    render(<OrganisationDetailClient organisation={opsOrganisation()} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Acme Driving School " } });
    fireEvent.change(screen.getByLabelText("Legal name"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Contact phone"), { target: { value: "07700 900000" } });
    fireEvent.click(screen.getByRole("button", { name: "Save details" }));
    await waitFor(() => expect(screen.getByText("Details saved.")).toBeTruthy());
    expect(calls[0]!.body).toEqual({
      name: "Acme Driving School",
      legal_name: null,
      contact_name: "Ana",
      contact_email: "ana@acme.test",
      contact_phone: "07700 900000",
    });
  });

  it("refuses a malformed contact email before the round trip", () => {
    const calls = stubFetch(() => ({ status: 200, body: {} }));
    render(<OrganisationDetailClient organisation={opsOrganisation()} />);
    fireEvent.change(screen.getByLabelText("Contact email"), { target: { value: "ana@" } });
    fireEvent.submit(screen.getByRole("form", { name: "School details" }));
    expect(screen.getByText("The contact email doesn't look right.")).toBeTruthy();
    expect(calls).toHaveLength(0);
  });

  it("records the seat subscription status for a per-seat school and warns when the API drops it", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { organisation: { subscription_status: null } } }));
    render(
      <OrganisationDetailClient
        organisation={opsOrganisation({ billing_mode: "per_seat", seats_purchased: 5, seat_price_pence: 2000 })}
      />
    );
    fireEvent.change(screen.getByLabelText(/^Seat subscription/), { target: { value: "active" } });
    fireEvent.click(screen.getByRole("button", { name: "Save billing terms" }));
    await waitFor(() => expect(screen.getByText(/did not record the seat subscription status/)).toBeTruthy());
    expect(calls[0]!.body).toMatchObject({ billing_mode: "per_seat", subscription_status: "active" });
  });
});

describe("ops organisation copy and member counts", () => {
  it("shows each member's 90-day record and the ADR-042 listing copy", () => {
    render(<OrganisationDetailClient organisation={opsOrganisation()} />);
    expect(screen.getByText("2 late cancellations · 1 sick day")).toBeTruthy();
    expect(document.body.textContent).not.toContain("never named");
    expect(document.body.textContent).toContain("appear on it as cards a learner can pick");
  });
});
