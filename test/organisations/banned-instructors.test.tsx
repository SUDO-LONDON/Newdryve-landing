import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { opsOrganisation } from "../fixtures";
import { readRemovedMembers, type RemovedMember } from "@/lib/organisations/removed-members";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
const { default: OrganisationPortalClient } = await import("@/components/organisations/OrganisationPortalClient");

const ORG = "11111111-2222-4333-8444-555555555555";
const INSTRUCTOR = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const banned: RemovedMember = {
  organisation_id: ORG,
  instructor_id: INSTRUCTOR,
  display_name: "Rae Former",
  email: "rae@example.test",
  removed_at: "2026-11-10T10:00:00.000Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

describe("banned instructors (#644)", () => {
  it("lists this school's banned instructors under its members", () => {
    render(
      <OrganisationPortalClient
        organisations={[opsOrganisation()]}
        removed={[banned, { ...banned, organisation_id: "other-school", display_name: "Not Ours" }]}
      />
    );
    expect(screen.getByRole("heading", { name: "Banned instructors" })).toBeTruthy();
    expect(screen.getByText("Rae Former")).toBeTruthy();
    expect(screen.getByText("rae@example.test · Removed 10 Nov")).toBeTruthy();
    expect(screen.queryByText("Not Ours")).toBeNull();
  });

  it("says when nobody is banned, and leaves the section out when the list could not be read", () => {
    const { unmount } = render(<OrganisationPortalClient organisations={[opsOrganisation()]} removed={[]} />);
    expect(screen.getByText("No banned instructors.")).toBeTruthy();
    unmount();
    render(<OrganisationPortalClient organisations={[opsOrganisation()]} removed={null} />);
    expect(screen.queryByRole("heading", { name: "Banned instructors" })).toBeNull();
  });

  it("unbans for this school and re-reads the page", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ reinvited: true, organisation_id: ORG, invite_sent: false }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<OrganisationPortalClient organisations={[opsOrganisation()]} removed={[banned]} />);
    fireEvent.click(screen.getByRole("button", { name: "Unban Rae Former" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`/organisations/api/removed-members/${INSTRUCTOR}/reinvite`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ organisation_id: ORG, send_invite: false });
  });

  it("sends the invite when asked, and says so when the email did not go", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ reinvited: true, organisation_id: ORG, invite_sent: false }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<OrganisationPortalClient organisations={[opsOrganisation()]} removed={[banned]} />);
    fireEvent.click(screen.getByRole("button", { name: "Unban Rae Former and send an invite" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("invite email could not be sent"));
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ organisation_id: ORG, send_invite: true });
  });

  it("shows the API's message when the unban fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Not an admin of this organisation" }), { status: 403 })));
    render(<OrganisationPortalClient organisations={[opsOrganisation()]} removed={[banned]} />);
    fireEvent.click(screen.getByRole("button", { name: "Unban Rae Former" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Not an admin of this organisation"));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("keeps only well-formed rows from the API", () => {
    expect(readRemovedMembers({
      items: [
        banned,
        { organisation_id: ORG, instructor_id: "x", removed_at: "2026-11-10T10:00:00.000Z", display_name: " ", email: "" },
        { organisation_id: ORG },
        null,
      ],
    })).toEqual([banned, { organisation_id: ORG, instructor_id: "x", removed_at: "2026-11-10T10:00:00.000Z", display_name: "Instructor", email: null }]);
    expect(readRemovedMembers(null)).toEqual([]);
  });
});
