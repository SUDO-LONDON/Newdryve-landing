import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seatLabel } from "@/lib/ops/types";
import { opsOrganisation } from "../fixtures";

// Each instructor holds a seat; the school can pause one for a month or
// resume it early (Newdryve ADR-060). The school itself is never paused.
const SCHOOL = "11111111-2222-4333-8444-555555555555";
const INSTRUCTOR = "22222222-3333-4444-8555-666666666666";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock("@/lib/organisations/supabase-server", () => ({ getOrganisationAccessToken: async () => "token" }));
vi.mock("@/lib/organisations/school", () => ({ getChosenSchool: async () => null }));

const { default: SeatPauseButton } = await import("@/components/organisations/SeatPauseButton");
const { default: OrganisationPortalClient } = await import("@/components/organisations/OrganisationPortalClient");

let calls: Array<{ url: string; method: string }> = [];
function stubFetch(status: number, body: unknown) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, method: String(init?.method) });
      return new Response(JSON.stringify(body), { status });
    })
  );
}

beforeEach(() => refresh.mockReset());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("seat label", () => {
  it("reads active, paused until a London date, or not available", () => {
    expect(seatLabel({ status: "active", paused_until: null, paused_by: null })).toBe("Active");
    expect(seatLabel({ status: "paused", paused_until: "2026-11-20T09:00:00.000Z", paused_by: "organisation_admin" })).toBe("Paused until 20 Nov 2026");
    expect(seatLabel(null)).toBe("Not available");
  });
});

describe("pause and resume a member's seat", () => {
  const endpoint = `/organisations/api/members/${INSTRUCTOR}/seat?organisation_id=${SCHOOL}`;

  it("pauses for 1 month only after the admin confirms, then refreshes", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    stubFetch(200, { seat: { status: "paused" } });
    render(<SeatPauseButton endpoint={endpoint} seat={{ status: "active", paused_until: null, paused_by: null }} instructorName="Sam" />);
    fireEvent.click(screen.getByRole("button", { name: "Pause Sam's seat for 1 month" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(confirm.mock.calls[0]![0]).toContain("Pause Sam's seat for 1 month?");
    expect(confirm.mock.calls[0]![0]).toContain("They stay linked to your school");
    expect(calls).toEqual([{ url: `/organisations/api/members/${INSTRUCTOR}/seat/pause?organisation_id=${SCHOOL}`, method: "POST" }]);
  });

  it("does nothing when not confirmed", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    stubFetch(200, {});
    render(<SeatPauseButton endpoint={endpoint} seat={{ status: "active", paused_until: null, paused_by: null }} instructorName="Sam" />);
    fireEvent.click(screen.getByRole("button", { name: "Pause Sam's seat for 1 month" }));
    expect(calls).toHaveLength(0);
  });

  it("resumes a paused seat, and says so when it changed meanwhile", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    stubFetch(409, { error: "This seat is not paused", code: "seat_not_paused" });
    render(
      <SeatPauseButton endpoint={endpoint} seat={{ status: "paused", paused_until: "2026-11-20T09:00:00.000Z", paused_by: "instructor" }} instructorName="Sam" />
    );
    fireEvent.click(screen.getByRole("button", { name: "Resume Sam's seat" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("That seat was changed meanwhile. Refresh to see it."));
    expect(calls[0]!.url).toBe(`/organisations/api/members/${INSTRUCTOR}/seat/resume?organisation_id=${SCHOOL}`);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows each member's seat on the roster, with who paused it", () => {
    const org = opsOrganisation();
    org.members[0]!.seat = { status: "paused", paused_until: "2026-11-20T09:00:00.000Z", paused_by: "instructor" };
    render(<OrganisationPortalClient organisations={[org]} />);
    expect(screen.getByText("Paused until 20 Nov 2026")).toBeTruthy();
    expect(screen.getByText("Paused by the instructor")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Resume .*'s seat/ })).toBeTruthy();
  });
});

describe("seat route", () => {
  async function load() {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEWDRYVE_API_ORIGIN", "https://api.test");
    return import("@/app/organisations/api/members/[instructorId]/seat/[action]/route");
  }
  const post = (action: string, id = INSTRUCTOR, headers: Record<string, string> = {}) =>
    new Request(`http://internal:3000/organisations/api/members/${id}/seat/${action}?organisation_id=${SCHOOL}`, {
      method: "POST",
      headers: { host: "newdryve.com", ...headers },
    });

  it("proxies pause and resume to the school's seat API", async () => {
    const { POST } = await load();
    stubFetch(200, { seat: { status: "paused" } });
    const response = await POST(post("pause"), { params: Promise.resolve({ instructorId: INSTRUCTOR, action: "pause" }) });
    expect(response.status).toBe(200);
    expect(calls[0]).toEqual({ url: `https://api.test/v1/organisations/me/members/${INSTRUCTOR}/seat/pause?organisation_id=${SCHOOL}`, method: "POST" });
  });

  it("passes the API's code through", async () => {
    const { POST } = await load();
    stubFetch(409, { error: { code: "conflict", message: "This seat is already paused", details: { code: "seat_already_paused" } } });
    const response = await POST(post("pause"), { params: Promise.resolve({ instructorId: INSTRUCTOR, action: "pause" }) });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "seat_already_paused" });
  });

  it("refuses an unknown action or id without calling the API", async () => {
    const { POST } = await load();
    stubFetch(200, {});
    expect((await POST(post("delete"), { params: Promise.resolve({ instructorId: INSTRUCTOR, action: "delete" }) })).status).toBe(404);
    expect((await POST(post("pause", "x"), { params: Promise.resolve({ instructorId: "x", action: "pause" }) })).status).toBe(404);
    expect(calls).toHaveLength(0);
  });
});
