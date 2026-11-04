import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let pathname = "/ops";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const { default: NavShell } = await import("@/components/ops/NavShell");
const { isOutreachPath } = await import("@/lib/ops/nav");

// The sidebar is the map of the portal: seven places at rest, grouped, and
// the nine outreach boards only while you are in Outreach.
describe("ops sidebar", () => {
  it("shows seven places in three groups, and no boards, on Today", () => {
    pathname = "/ops";
    render(
      <NavShell email="founder@newdryve.test">
        <p>content</p>
      </NavShell>
    );
    const nav = screen.getAllByRole("navigation", { name: "Portal sections" })[0]!;
    const labels = Array.from(nav.querySelectorAll("a")).map((a) => a.textContent?.trim());
    expect(labels).toEqual(["Today", "Instructors", "Schools", "Money", "Outreach", "Delivery", "Documents"]);
    expect(nav.textContent).toContain("Run the business");
    expect(nav.textContent).toContain("Grow");
    expect(nav.textContent).toContain("The company");
    expect(nav.textContent).not.toContain("Instructor Pipeline");
    expect(nav.querySelector('a[aria-current="page"]')?.textContent).toBe("Today");
  });

  it("unfolds the outreach boards inside Outreach, with the open board marked", () => {
    pathname = "/ops/customers/instructors";
    render(
      <NavShell email="founder@newdryve.test">
        <p>content</p>
      </NavShell>
    );
    const nav = screen.getAllByRole("navigation", { name: "Portal sections" })[0]!;
    expect(nav.textContent).toContain("Instructor Pipeline");
    expect(nav.textContent).toContain("Investor Contacts");
    const current = Array.from(nav.querySelectorAll('a[aria-current="page"]')).map((a) => a.textContent);
    expect(current).toEqual(["Outreach", "Instructor Pipeline"]);
    // Each place says what it is for.
    expect(nav.querySelector('a[href="/ops/money"]')?.getAttribute("title")).toMatch(/Funding received/);
  });

  it("knows which paths are the outreach area", () => {
    expect(isOutreachPath("/ops/outreach")).toBe(true);
    expect(isOutreachPath("/ops/investors/obligations")).toBe(true);
    expect(isOutreachPath("/ops/organisations")).toBe(false);
    expect(isOutreachPath("/ops")).toBe(false);
  });
});
