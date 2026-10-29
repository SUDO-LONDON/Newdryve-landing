import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CancellationPolicyForm from "@/components/organisations/CancellationPolicyForm";

const ORG = "11111111-2222-4333-8444-555555555555";

describe("CancellationPolicyForm", () => {
  it("shows the loaded policy and saves a change with the school named", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({ cancellation_policy: { notice_hours: body.notice_hours, late_fee_bps: body.late_fee_bps }, applied: true }),
        { status: 200 }
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CancellationPolicyForm
        schools={[{ id: ORG, name: "Acme", policy: { cancellation_policy: { notice_hours: 24, late_fee_bps: 5000 }, applied: true } }]}
      />
    );
    const notice = screen.getByLabelText("Notice needed to cancel") as HTMLSelectElement;
    const fee = screen.getByLabelText("Late cancellation fee") as HTMLSelectElement;
    expect(notice.value).toBe("24");
    expect(fee.value).toBe("5000");
    expect(screen.getByText(/less than 24 hours' notice pays half the lesson price/)).toBeTruthy();

    fireEvent.change(notice, { target: { value: "48" } });
    fireEvent.change(fee, { target: { value: "10000" } });
    fireEvent.click(screen.getByRole("button", { name: "Save cancellation policy" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Saved."));
    expect(fetchMock).toHaveBeenCalledWith(
      "/organisations/api/cancellation-policy",
      expect.objectContaining({ method: "PUT" })
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]!.body))).toEqual({
      organisation_id: ORG,
      notice_hours: 48,
      late_fee_bps: 10000,
    });
    vi.unstubAllGlobals();
  });

  it("says when a cancelled school's policy is not applied", () => {
    render(
      <CancellationPolicyForm
        schools={[{ id: ORG, name: "Acme", policy: { cancellation_policy: { notice_hours: 24, late_fee_bps: 5000 }, applied: false } }]}
      />
    );
    expect(screen.getByText(/Your school has been cancelled, so each instructor.s own policy applies/)).toBeTruthy();
  });

  it("will not save over a policy it could not read", () => {
    render(<CancellationPolicyForm schools={[{ id: ORG, name: "Acme", policy: null, error: "Could not reach Newdryve." }]} />);
    expect(screen.getByRole("alert").textContent).toBe("Could not reach Newdryve.");
    expect((screen.getByRole("button", { name: "Save cancellation policy" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the API's validation message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "notice_hours must be one of 2, 6, 12, 24, 48, 72" }), { status: 422 }))
    );
    render(
      <CancellationPolicyForm
        schools={[{ id: ORG, name: "Acme", policy: { cancellation_policy: { notice_hours: 24, late_fee_bps: 5000 }, applied: true } }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Save cancellation policy" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("notice_hours must be one of"));
    vi.unstubAllGlobals();
  });
});
