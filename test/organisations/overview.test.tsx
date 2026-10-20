import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { opsOrganisation } from "../fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
const { default: OrganisationPortalClient } = await import("@/components/organisations/OrganisationPortalClient");

describe("portal overview", () => {
  it("says the school is paused by Newdryve instead of 'not linked'", () => {
    render(<OrganisationPortalClient organisations={[]} unavailable={[{ id: "o1", name: "Acme", status: "paused" }]} />);
    expect(screen.getByRole("heading", { name: "This school is paused by Newdryve" })).toBeTruthy();
    expect(document.body.textContent).not.toContain("not linked");
    expect(document.body.textContent).not.toContain("No organisation access");
  });

  it("keeps the plain 'not linked' copy when nothing is paused", () => {
    render(<OrganisationPortalClient organisations={[]} />);
    expect(screen.getByText("No organisation access yet")).toBeTruthy();
  });

  it("shows each member's 90-day record, today's lessons as 'Rest of today', and a paused second school", () => {
    render(
      <OrganisationPortalClient
        organisations={[
          opsOrganisation({
            upcoming_today: [{ id: "b1", instructor_name: "Sam Driver", learner_name: "Lee", starts_at: "2026-10-20T15:00:00.000Z", status: "confirmed" }],
          }),
        ]}
        unavailable={[{ id: "o2", name: "Beta School", status: "closed" }]}
      />
    );
    expect(screen.getByText("2 late cancellations · 1 sick day")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Rest of today" })).toBeTruthy();
    expect(screen.queryByText("Next 24 hours")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Beta School has been closed");
  });
});
