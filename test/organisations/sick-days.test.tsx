import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SickDaysPanel } from "@/components/organisations/MemberSickDays";
import { addDays, londonToday } from "@/lib/organisations/format";
import {
  isCalendarDate,
  previewSummary,
  recordedByLabel,
  resultMessage,
  sickDaysEndpoint,
  type SickDay,
} from "@/lib/organisations/sick-days";

const ORG = "11111111-2222-4333-8444-555555555555";
const INSTRUCTOR = "22222222-3333-4444-8555-666666666666";
const TODAY = londonToday();
const FAR = addDays(TODAY, 60);

vi.mock("@/lib/organisations/supabase-server", () => ({ getOrganisationAccessToken: async () => "token" }));
vi.mock("@/lib/organisations/school", () => ({ getChosenSchool: async () => null }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("sick-day helpers", () => {
  it("accepts only real dates and builds the school-scoped endpoint", () => {
    expect(isCalendarDate("2026-11-02")).toBe(true);
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCalendarDate("../x")).toBe(false);
    expect(sickDaysEndpoint(INSTRUCTOR, ORG, "/preview")).toBe(
      `/organisations/api/members/${INSTRUCTOR}/sick-days/preview?organisation_id=${ORG}`
    );
  });

  it("says who gave each day", () => {
    expect(recordedByLabel({ removable: true, recorded_by_organisation: { id: ORG, name: "Acme" } }, "Sam")).toBe("Given by your school");
    expect(recordedByLabel({ removable: false, recorded_by_organisation: null }, "Sam")).toBe("Called in by Sam");
    expect(recordedByLabel({ removable: false, recorded_by_organisation: { id: "o2", name: "Old School" } }, "Sam")).toBe("Given by Old School");
  });

  it("says what a day will cancel, and what happened", () => {
    const lesson = { booking_id: "b1", starts_at: "2026-11-02T10:00:00Z", learner_name: "Ava" };
    expect(previewSummary({ date: FAR, allowed: true, lessons: [lesson], started: [] }, "Sam")).toMatch(/^1 lesson will be cancelled, free for the learners/);
    expect(previewSummary({ date: FAR, allowed: true, lessons: [], started: [] }, "Sam")).toMatch(/^Sam has no lessons booked that day/);
    expect(previewSummary({ date: FAR, allowed: false, reason: "already_sick", lessons: [], started: [] }, "Sam")).toBe("Sam is already off sick that day.");
    expect(previewSummary({ date: "2020-01-01", allowed: false, reason: "date_out_of_range", lessons: [], started: [] }, "Sam")).toBe("Choose today or a later day.");
    const result = { sick_day: { date: TODAY, created_at: "", recorded_by_organisation: null }, cancelled: [lesson, lesson], started: [] };
    expect(resultMessage(result, "Sam", true)).toBe("Sam is off sick today. 2 lessons cancelled and the learners told. We've let Sam know.");
    expect(resultMessage(result, "Sam", false)).toBe("Sam was already off sick today. Nothing changed.");
  });
});

describe("portal sick-day routes", () => {
  let requests: Array<{ url: string; init: RequestInit }> = [];
  beforeEach(() => {
    requests = [];
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEWDRYVE_API_ORIGIN", "https://api.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        requests.push({ url, init });
        return new Response(JSON.stringify({ ok: true }), { status: 201 });
      })
    );
  });
  const params = <T,>(value: T) => ({ params: Promise.resolve(value) });
  const headers = { origin: "https://newdryve.com", host: "newdryve.com" };

  it("gives a sick day through the API with the school named", async () => {
    const { POST } = await import("@/app/organisations/api/members/[instructorId]/sick-days/route");
    const response = await POST(
      new Request(`https://newdryve.com${sickDaysEndpoint(INSTRUCTOR, ORG)}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ date: FAR, organisation_id: ORG }),
      }),
      params({ instructorId: INSTRUCTOR })
    );
    expect(response.status).toBe(201);
    expect(requests[0]!.url).toBe(`https://api.test/v1/organisations/instructors/${INSTRUCTOR}/sick-days?organisation_id=${ORG}`);
    expect(requests[0]!.init.method).toBe("POST");
    expect(JSON.parse(String(requests[0]!.init.body))).toEqual({ date: FAR, organisation_id: ORG });
    expect((requests[0]!.init.headers as Record<string, string>).authorization).toBe("Bearer token");
  });

  it("refuses a write from another site, and never puts a bad id or date in the API path", async () => {
    const { POST } = await import("@/app/organisations/api/members/[instructorId]/sick-days/route");
    const foreign = await POST(
      new Request(`https://newdryve.com${sickDaysEndpoint(INSTRUCTOR, ORG)}`, {
        method: "POST",
        headers: { origin: "https://evil.example", host: "newdryve.com" },
        body: JSON.stringify({ date: FAR }),
      }),
      params({ instructorId: INSTRUCTOR })
    );
    expect(foreign.status).toBe(403);
    const { DELETE } = await import("@/app/organisations/api/members/[instructorId]/sick-days/[date]/route");
    const badDate = await DELETE(new Request("https://newdryve.com/x", { method: "DELETE", headers }), params({ instructorId: INSTRUCTOR, date: "..%2Fx" }));
    expect(badDate.status).toBe(404);
    const badId = await POST(new Request("https://newdryve.com/x", { method: "POST", headers, body: "{}" }), params({ instructorId: "nope" }));
    expect(badId.status).toBe(404);
    const { GET } = await import("@/app/organisations/api/members/[instructorId]/sick-days/preview/route");
    expect((await GET(new Request("https://newdryve.com/x?date=tomorrow"), params({ instructorId: INSTRUCTOR }))).status).toBe(422);
    expect(requests).toEqual([]);
  });

  it("previews and removes through the API", async () => {
    const { GET } = await import("@/app/organisations/api/members/[instructorId]/sick-days/preview/route");
    await GET(new Request(`https://newdryve.com/x?date=${FAR}&organisation_id=${ORG}`), params({ instructorId: INSTRUCTOR }));
    expect(requests[0]!.url).toBe(`https://api.test/v1/organisations/instructors/${INSTRUCTOR}/sick-days/preview?date=${FAR}&organisation_id=${ORG}`);
    const { DELETE } = await import("@/app/organisations/api/members/[instructorId]/sick-days/[date]/route");
    await DELETE(new Request(`https://newdryve.com/x?organisation_id=${ORG}`, { method: "DELETE", headers }), params({ instructorId: INSTRUCTOR, date: FAR }));
    expect(requests[1]!.url).toBe(`https://api.test/v1/organisations/instructors/${INSTRUCTOR}/sick-days/${FAR}?organisation_id=${ORG}`);
    expect(requests[1]!.init.method).toBe("DELETE");
  });
});

describe("SickDaysPanel", () => {
  type Call = { url: string; init?: RequestInit };
  function api(handlers: Record<string, (call: Call) => Response>) {
    const calls: Call[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        const call = { url, init };
        calls.push(call);
        const method = init?.method ?? "GET";
        const key = `${method} ${url.includes("/preview") ? "preview" : /sick-days\/\d{4}/.test(url) ? "day" : "list"}`;
        const handler = handlers[key];
        if (!handler) throw new Error(`unexpected ${key}`);
        return handler(call);
      })
    );
    return calls;
  }
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

  it("lists days from today with who gave them, previews a far day and gives it after a confirm", async () => {
    const confirm = vi.fn(() => true);
    vi.stubGlobal("confirm", confirm);
    let listed: SickDay[] = [{ date: TODAY, created_at: "", cancelled_count: 0, recorded_by_organisation: null, removable: false }];
    const calls = api({
      "GET list": () => json({ sick_days: listed }),
      "GET preview": () => json({ date: FAR, allowed: true, lessons: [{ booking_id: "b1", starts_at: `${FAR}T10:00:00Z`, learner_name: "Ava Learner" }], started: [] }),
      "POST list": () => {
        listed = [...listed, { date: FAR, created_at: "", cancelled_count: 1, recorded_by_organisation: { id: ORG, name: "Acme" }, removable: true }];
        return json({ sick_day: { date: FAR, created_at: "", recorded_by_organisation: { id: ORG, name: "Acme" } }, cancelled: [{ booking_id: "b1", starts_at: "", learner_name: "Ava Learner" }], started: [] }, 201);
      },
    });
    render(<SickDaysPanel titleId="sd" instructorId={INSTRUCTOR} instructorName="Sam Carter" organisationId={ORG} />);
    await screen.findByText("Called in by Sam Carter");
    // The instructor's own day cannot be removed by the school.
    expect(screen.queryByRole("button", { name: /Reopen/ })).toBeNull();

    const input = screen.getByLabelText("Give a sick day") as HTMLInputElement;
    expect(input.min).toBe(TODAY);
    expect(input.max).toBe("");
    const giveButton = screen.getByRole("button", { name: "Give sick day" }) as HTMLButtonElement;
    expect(giveButton.disabled).toBe(true);
    fireEvent.change(input, { target: { value: FAR } });
    await screen.findByText(/1 lesson will be cancelled, free for the learners/);
    expect(screen.getByText("Ava Learner")).toBeTruthy();
    fireEvent.click(giveButton);

    await waitFor(() => expect(screen.getByRole("status").textContent).toMatch(/Sam Carter is off sick on .*1 lesson cancelled and the learners told/));
    expect(confirm).toHaveBeenCalledTimes(1);
    const post = calls.find((c) => c.init?.method === "POST")!;
    expect(post.url).toBe(sickDaysEndpoint(INSTRUCTOR, ORG));
    expect(JSON.parse(String(post.init!.body))).toEqual({ date: FAR, organisation_id: ORG });
    await screen.findByText(/Given by your school · 1 lesson cancelled/);
    expect(screen.getByRole("button", { name: /Reopen .* for Sam Carter/ })).toBeTruthy();
  });

  it("does nothing when the confirm is declined", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    const calls = api({
      "GET list": () => json({ sick_days: [] }),
      "GET preview": () => json({ date: FAR, allowed: true, lessons: [], started: [] }),
    });
    render(<SickDaysPanel instructorId={INSTRUCTOR} instructorName="Sam" organisationId={ORG} />);
    await screen.findByText("No sick days from today.");
    fireEvent.change(screen.getByLabelText("Give a sick day"), { target: { value: FAR } });
    await screen.findByText(/Sam has no lessons booked that day/);
    fireEvent.click(screen.getByRole("button", { name: "Give sick day" }));
    expect(calls.some((c) => c.init?.method === "POST")).toBe(false);
  });

  it("removes a day the school gave, and explains a day only the instructor can reopen", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    let removable = true;
    const calls = api({
      "GET list": () => json({ sick_days: removable ? [{ date: FAR, created_at: "", cancelled_count: 0, recorded_by_organisation: { id: ORG, name: "Acme" }, removable: true }] : [] }),
      "DELETE day": () => {
        removable = false;
        return new Response(null, { status: 204 });
      },
    });
    render(<SickDaysPanel instructorId={INSTRUCTOR} instructorName="Sam" organisationId={ORG} />);
    fireEvent.click(await screen.findByRole("button", { name: /Reopen .* for Sam/ }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toMatch(/is open to bookings again/));
    expect(calls.find((c) => c.init?.method === "DELETE")!.url).toBe(sickDaysEndpoint(INSTRUCTOR, ORG, `/${FAR}`));
    await screen.findByText("No sick days from today.");
  });

  it("names the instructor's own day in the error when the API refuses removal", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    api({
      "GET list": () => json({ sick_days: [{ date: FAR, created_at: "", cancelled_count: 0, recorded_by_organisation: { id: ORG, name: "Acme" }, removable: true }] }),
      "DELETE day": () => json({ error: "Only the instructor can reopen a day they called in sick themselves", code: "not_given_by_school" }, 409),
    });
    render(<SickDaysPanel instructorId={INSTRUCTOR} instructorName="Sam" organisationId={ORG} />);
    fireEvent.click(await screen.findByRole("button", { name: /Reopen .* for Sam/ }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Sam called in sick that day themselves, so only they can reopen it."));
  });
});
