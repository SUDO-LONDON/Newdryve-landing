import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LearnerHoursPanel from "@/components/organisations/LearnerHoursPanel";
import PackagesPanel from "@/components/organisations/PackagesPanel";
import type { LearnerHours, SchoolPackage } from "@/lib/organisations/packages";

const ORG = "11111111-2222-4333-8444-555555555555";
const PKG = "22222222-3333-4444-8555-666666666666";
const OWNED = "33333333-4444-4555-8666-777777777777";

function pkg(over: Partial<SchoolPackage> = {}): SchoolPackage {
  return {
    id: PKG, category: "weekly_manual", category_label: "Weekly manual", name: "10 hours intro daytime", minutes: 600, hours_label: "10 hours",
    transmission: "manual", lesson_times: ["weekday_daytime"], lesson_times_label: "weekday daytimes", price_pence: 43000, valid_months: 12,
    is_active: true, sort_order: 0, ...over,
  };
}
function hours(over: Partial<LearnerHours> = {}): LearnerHours {
  return {
    id: OWNED, name: "10 hours intro daytime", category_label: "Weekly manual", learner_name: "Priya Shah", learner_phone_e164: "+447700900123",
    has_account: true, minutes_total: 600, minutes_used: 120, minutes_booked: 60, minutes_left: 420, hours_total_label: "10 hours",
    hours_left_label: "7 hours", minutes_adjusted: 0, adjust_note: null, expires_at: "2027-11-14T09:00:00.000Z", state: "active",
    created_at: "2026-11-14T09:00:00.000Z", ...over,
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
const field = (name: string | RegExp) => screen.getByLabelText(name) as HTMLInputElement;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PackagesPanel", () => {
  it("starts on the form for a school with no packages, and adds one naming the school", async () => {
    const calls = stubFetch(() => ({ status: 201, body: { package: pkg() } }));
    render(<PackagesPanel organisationId={ORG} packages={[]} />);
    expect(screen.getByText(/No packages yet/)).toBeTruthy();

    fireEvent.change(field("Name"), { target: { value: "10 hours intro daytime" } });
    fireEvent.change(field("Hours"), { target: { value: "10" } });
    fireEvent.change(field("Car"), { target: { value: "manual" } });
    fireEvent.click(field("Weekday daytimes"));
    fireEvent.change(field(/Price/), { target: { value: "430" } });
    fireEvent.click(screen.getByRole("button", { name: "Add package" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Added."));
    expect(calls).toEqual([
      {
        url: "/organisations/api/packages",
        method: "POST",
        body: { organisation_id: ORG, category: "weekly_manual", name: "10 hours intro daytime", minutes: 600, transmission: "manual", lesson_times: ["weekday_daytime"], price_pence: 43000, valid_months: 12 },
      },
    ]);
    // It is on the list, and the form has closed.
    expect(screen.getByText("10 hours · manual · weekday daytimes · lasts 12 months · £430")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add package" })).toBeNull();
  });

  it("refuses a bad value without a request", () => {
    const calls = stubFetch(() => ({ status: 500, body: {} }));
    render(<PackagesPanel organisationId={ORG} packages={[]} />);
    fireEvent.change(field("Name"), { target: { value: "Half a lesson" } });
    fireEvent.change(field("Hours"), { target: { value: "0.1" } });
    fireEvent.click(screen.getByRole("button", { name: "Add package" }));
    expect(screen.getByRole("alert").textContent).toMatch(/how many hours/);
    expect(calls).toEqual([]);
  });

  it("changes a package with only what changed, and says learners keep what they bought", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { package: pkg({ minutes: 720, hours_label: "12 hours" }) } }));
    render(<PackagesPanel organisationId={ORG} packages={[pkg()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Change 10 hours intro daytime" }));
    expect(field("Hours").value).toBe("10");
    fireEvent.change(field("Hours"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("keep the hours they bought"));
    expect(calls).toEqual([{ url: `/organisations/api/packages/${PKG}`, method: "PATCH", body: { organisation_id: ORG, minutes: 720 } }]);
    expect(screen.getByText(/12 hours · manual/)).toBeTruthy();
  });

  it("takes a package off sale and puts it back", async () => {
    const calls = stubFetch((call) => ({ status: 200, body: { package: pkg({ is_active: call.body?.is_active === true }) } }));
    render(<PackagesPanel organisationId={ORG} packages={[pkg()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Take 10 hours intro daytime off sale" }));
    await waitFor(() => expect(screen.getByText("Off sale")).toBeTruthy());
    expect(screen.getByRole("status").textContent).toContain("keep their hours");
    fireEvent.click(screen.getByRole("button", { name: "Put 10 hours intro daytime back on sale" }));
    await waitFor(() => expect(screen.queryByText("Off sale")).toBeNull());
    expect(calls.map((c) => c.body)).toEqual([{ organisation_id: ORG, is_active: false }, { organisation_id: ORG, is_active: true }]);
  });

  it("shows the API's reason when a save is refused", async () => {
    stubFetch(() => ({ status: 403, body: { error: "Insufficient role" } }));
    render(<PackagesPanel organisationId={ORG} packages={[pkg()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Take 10 hours intro daytime off sale" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Insufficient role"));
    expect(screen.queryByText("Off sale")).toBeNull();
  });
});

describe("LearnerHoursPanel", () => {
  it("shows each learner's hours left, what is booked, and who has not opened the app yet", () => {
    render(<LearnerHoursPanel organisationId={ORG} items={[hours(), hours({ id: "x", learner_name: "Noah Reid", has_account: false, minutes_booked: 0, hours_left_label: "10 hours", state: "active" }), hours({ id: "y", learner_name: "Old Learner", state: "expired" })]} />);
    const rows = screen.getAllByRole("listitem");
    expect(within(rows[0]!).getByText("7 hours left")).toBeTruthy();
    expect(within(rows[0]!).getByText(/of 10 hours · 1h booked/)).toBeTruthy();
    // The year is shown: a package lasts a year or more.
    expect(within(rows[0]!).getByText(/use by 14 Nov 2027/)).toBeTruthy();
    expect(within(rows[1]!).getByText("Not confirmed in the app yet")).toBeTruthy();
    expect(within(rows[2]!).getByText("Run out")).toBeTruthy();
  });

  it("corrects hours used before the learner was added, in hours, and shows the new balance", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { item: { id: OWNED, minutes_used: 360, minutes_left: 180, hours_left_label: "3 hours", state: "active" } } }));
    render(<LearnerHoursPanel organisationId={ORG} items={[hours()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Correct Priya Shah's hours" }));
    fireEvent.change(field(/Correction/), { target: { value: "-4" } });
    fireEvent.change(field(/Note/), { target: { value: "Lessons before Newdryve" } });
    fireEvent.click(screen.getByRole("button", { name: "Save correction" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Saved. Priya Shah now has 3 hours left."));
    expect(calls).toEqual([
      { url: `/organisations/api/learner-packages/${OWNED}`, method: "PATCH", body: { organisation_id: ORG, minutes_adjusted: -240, adjust_note: "Lessons before Newdryve" } },
    ]);
    expect(screen.getByText("3 hours left")).toBeTruthy();
    expect(screen.getByText(/corrected by -4h/)).toBeTruthy();
    // The learner's name stays, though the answer does not carry it.
    expect(screen.getByText("Priya Shah")).toBeTruthy();
  });

  it("shows the API's refusal when a correction would undo lessons already taught", async () => {
    stubFetch(() => ({ status: 409, body: { error: "That leaves fewer hours than the lessons already taught or booked with this package", code: "package_hours_short" } }));
    render(<LearnerHoursPanel organisationId={ORG} items={[hours()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Correct Priya Shah's hours" }));
    fireEvent.change(field(/Correction/), { target: { value: "-9" } });
    fireEvent.click(screen.getByRole("button", { name: "Save correction" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/fewer hours than the lessons already taught/));
    expect(screen.getByText("7 hours left")).toBeTruthy();
  });

  it("cancels a package only after the school confirms", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { item: { id: OWNED, state: "voided", minutes_left: 420, hours_left_label: "7 hours" } } }));
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    render(<LearnerHoursPanel organisationId={ORG} items={[hours()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Correct Priya Shah's hours" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel this package" }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([]);

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Cancel this package" }));
    await waitFor(() => expect(screen.getByText("Cancelled")).toBeTruthy());
    expect(calls).toEqual([{ url: `/organisations/api/learner-packages/${OWNED}`, method: "PATCH", body: { organisation_id: ORG, voided: true } }]);
    // A cancelled package offers nothing more to do.
    expect(screen.queryByRole("button", { name: /Correct/ })).toBeNull();
  });

  it("says so when nobody has bought a package", () => {
    render(<LearnerHoursPanel organisationId={ORG} items={[]} />);
    expect(screen.getByText(/Nobody yet/)).toBeTruthy();
  });
});
