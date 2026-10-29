import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InvoicesView from "@/components/organisations/InvoicesView";
import type { BillingResponse, Invoice } from "@/lib/organisations/types";

const ORG = "11111111-2222-4333-8444-555555555555";

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    organisation_id: ORG,
    instructor_id: "i1",
    number: "ACME-0001",
    period_start: "2026-10-05",
    period_end: "2026-10-11",
    lessons: 3,
    lesson_minutes: 180,
    revenue_pence: 15000,
    amount_pence: 2500,
    terms: {
      fee_mode: "flat_weekly",
      amount_pence: 2500,
      percent_bps: null,
      description: "£25 a week",
      payment_terms_days: 7,
      from_name: "Acme",
      from_address: null,
      bank: null,
      notes: null,
      organisation_name: "Acme",
      instructor_name: "Sam Driver",
    },
    status: "void",
    issued_at: "2026-10-12T08:00:00.000Z",
    due_on: "2099-01-01",
    paid_at: null,
    emailed_at: null,
    ...overrides,
  };
}

const billing = {
  organisations: [
    {
      id: ORG,
      name: "Acme",
      legal_name: null,
      billing: { organisation_id: ORG, fee_mode: "flat_weekly", bank_account_name: "Acme Ltd", bank_sort_code: "123456", bank_account_number: "12345678" },
      invoices_held: null,
    },
  ],
} as unknown as BillingResponse;

function heldBilling(invoicesHeld: "bank_details_missing" | undefined = "bank_details_missing"): BillingResponse {
  const org = billing.organisations[0]!;
  return {
    organisations: [
      {
        ...org,
        billing: { ...org.billing, bank_account_name: null, bank_sort_code: null, bank_account_number: null },
        ...(invoicesHeld ? { invoices_held: invoicesHeld } : { invoices_held: undefined }),
      },
    ],
  };
}

describe("InvoicesView", () => {
  it("restores a void invoice through the status route", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ invoice: invoice({ status: "issued" }) }), { status: 200, headers: { "content-type": "application/json" } })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<InvoicesView initial={[invoice()]} billing={billing} />);
    const row = screen.getAllByRole("listitem")[0]!;
    expect(within(row).getByText("Void")).toBeTruthy();
    // A void invoice cannot be sent or voided again; it can only be restored.
    expect(within(row).queryByRole("button", { name: /send/i })).toBeNull();

    fireEvent.click(within(row).getByRole("button", { name: "Restore" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Invoice ACME-0001 restored"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/organisations/api/invoices/inv-1/status",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ status: "issued" }) })
    );
    const [restored] = screen.getAllByRole("listitem");
    expect(within(restored!).getByText("Unpaid")).toBeTruthy();
    expect(within(restored!).queryByRole("button", { name: "Restore" })).toBeNull();
    expect(within(restored!).getByRole("button", { name: "Mark paid" })).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it("shows the API's refusal and keeps the invoice void", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404 }))
    );
    render(<InvoicesView initial={[invoice()]} billing={billing} />);
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Invoice not found"));
    expect(screen.getByRole("button", { name: "Restore" })).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it("says invoices are on hold without bank details, links to the form, and explains the disabled Raise button", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<InvoicesView initial={[]} billing={heldBilling()} />);
    expect(screen.getByText("Invoices are on hold until you add your bank details")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Add your bank details" }).getAttribute("href")).toBe(`/organisations/settings#bank-${ORG}`);
    const raise = screen.getByRole("button", { name: "Raise invoices" }) as HTMLButtonElement;
    expect(raise.disabled).toBe(true);
    expect(document.getElementById(raise.getAttribute("aria-describedby")!)?.textContent).toContain("add your bank details in Settings before raising invoices");
    fireEvent.click(raise);
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("works the hold out from the billing row when the API does not say", () => {
    render(<InvoicesView initial={[]} billing={heldBilling(undefined)} />);
    expect(screen.getByText("Invoices are on hold until you add your bank details")).toBeTruthy();
  });

  it("shows no hold with bank details, and explains a 409 bank_details_missing instead of failing silently", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ error: { code: "conflict", message: "Invoices are on hold", details: { code: "bank_details_missing", held: true, reason: "bank_details_missing" } } }),
          { status: 409 }
        )
      )
    );
    render(<InvoicesView initial={[]} billing={billing} />);
    expect(screen.queryByText(/on hold until you add your bank details$/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Raise invoices" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Invoices are on hold until you add your bank details in Settings"));
    vi.unstubAllGlobals();
  });
});
