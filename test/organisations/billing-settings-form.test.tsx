import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BillingSettingsForm from "@/components/organisations/BillingSettingsForm";
import type { BillingResponse } from "@/lib/organisations/types";

const ORG = "11111111-2222-4333-8444-555555555555";

function data(bank: { name: string | null; sort: string | null; number: string | null }, feeMode = "flat_weekly"): BillingResponse {
  const held = feeMode !== "off" && !(bank.name && bank.sort && bank.number);
  return {
    organisations: [
      {
        id: ORG,
        name: "Acme",
        legal_name: null,
        billing: {
          organisation_id: ORG,
          fee_mode: feeMode,
          amount_pence: 2500,
          percent_bps: null,
          payment_terms_days: 7,
          bank_account_name: bank.name,
          bank_sort_code: bank.sort,
          bank_account_number: bank.number,
          invoice_from_name: null,
          invoice_from_address: null,
          invoice_notes: null,
        },
        invoices_held: held ? "bank_details_missing" : null,
      },
    ],
  } as unknown as BillingResponse;
}

const NO_BANK = { name: null, sort: null, number: null };
const HELD = "Invoices are on hold until you add your bank details";

afterEach(() => vi.unstubAllGlobals());

describe("BillingSettingsForm: invoices on hold (ADR-060)", () => {
  it("warns that invoices are on hold and links to the bank details on the same page", () => {
    render(<BillingSettingsForm data={data(NO_BANK)} />);
    expect(screen.getByText(HELD)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Add your bank details" }).getAttribute("href")).toBe(`#bank-${ORG}`);
    expect(document.getElementById(`bank-${ORG}`)?.tagName).toBe("FIELDSET");
  });

  it("shows no warning when the bank details are in, or when invoices are off", () => {
    const { unmount } = render(<BillingSettingsForm data={data({ name: "Acme Ltd", sort: "123456", number: "12345678" })} />);
    expect(screen.queryByText(HELD)).toBeNull();
    unmount();
    render(<BillingSettingsForm data={data(NO_BANK, "off")} />);
    expect(screen.queryByText(HELD)).toBeNull();
  });

  it("lifts the warning once the bank details are saved", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ billing: {} }), { status: 200 })));
    render(<BillingSettingsForm data={data(NO_BANK)} />);
    fireEvent.change(screen.getByLabelText("Account name"), { target: { value: "Acme Ltd" } });
    fireEvent.change(screen.getByLabelText("Sort code"), { target: { value: "12-34-56" } });
    fireEvent.change(screen.getByLabelText("Account number"), { target: { value: "12345678" } });
    // Typed but not saved: still on hold.
    expect(screen.getByText(HELD)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save bank and invoice details" }));
    await waitFor(() => expect(screen.getByText("Saved. Invoices will use these details from next Monday.")).toBeTruthy());
    expect(screen.queryByText(HELD)).toBeNull();
  });

  it("says invoices stay on hold when saved without bank details", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ billing: {} }), { status: 200 })));
    render(<BillingSettingsForm data={data(NO_BANK)} />);
    fireEvent.click(screen.getByRole("button", { name: "Save bank and invoice details" }));
    await waitFor(() => expect(screen.getByText("Saved. Invoices stay on hold until you add your bank details.")).toBeTruthy());
    expect(screen.getByText(HELD)).toBeTruthy();
  });
});
