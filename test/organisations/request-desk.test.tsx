import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

import RequestDesk from "@/components/organisations/RequestDesk";
import RequestsView from "@/components/organisations/RequestsView";
import SchoolDayBoard from "@/components/organisations/SchoolDayBoard";
import { decisionText, londonMinutes, milesText } from "@/lib/organisations/requests";
import type { DeskCandidate, RequestDetailResponse, RequestSummary, RequestsResponse, SchoolDay } from "@/lib/organisations/requests";

const ORG = "11111111-2222-4333-8444-555555555555";
const REQ = "aaaaaaaa-2222-4333-8444-555555555555";

function summary(overrides: Partial<RequestSummary> = {}): RequestSummary {
  return {
    id: REQ,
    organisation: { id: ORG, name: "Chilled Driving School" },
    learner: { name: "Priya S." },
    lesson: { code: "1h", label: "1 hour", duration_minutes: 60 },
    // Wednesday 18 November 2026, 10:00–11:00 London.
    starts_at: "2026-11-18T10:00:00.000Z",
    ends_at: "2026-11-18T11:00:00.000Z",
    pickup_label: "Unthank Road, NR2",
    price_pence: 4000,
    status: "pending",
    waiting: true,
    expires_at: "2026-11-18T09:30:00.000Z",
    expired: false,
    requested_at: "2026-11-16T07:30:00.000Z",
    held_at: "2026-11-16T07:30:00.000Z",
    learner_chose: false,
    instructor: { id: "a", name: "Anna" },
    passed_instructors: [],
    preferences: { transmission: "manual", language: null, gender_preference: null, test_centre: null },
    decision: null,
    decided_at: null,
    decided_by: null,
    ...overrides,
  };
}

function candidate(overrides: Partial<DeskCandidate> & { instructor_id: string; name: string }): DeskCandidate {
  return {
    available: true,
    unavailable_reason: null,
    warnings: [],
    recommended: false,
    current: false,
    learner_chose: false,
    miles: null,
    distance_from: null,
    previous_lesson: null,
    next_lesson: null,
    lessons_that_day: 0,
    price_pence: 4000,
    ...overrides,
  };
}

const DAY: SchoolDay = {
  date: "2026-11-18",
  organisation: { id: ORG, name: "Chilled Driving School" },
  instructors: [
    { instructor_id: "a", name: "Anna", working_hours: [{ start: "09:00", end: "17:00" }], items: [{ kind: "request", id: REQ, starts_at: "2026-11-18T10:00:00.000Z", ends_at: "2026-11-18T11:00:00.000Z", title: "Priya S.", held_by_school: true }] },
    { instructor_id: "b", name: "Ben", working_hours: [{ start: "09:00", end: "17:00" }], items: [{ kind: "lesson", id: "l1", starts_at: "2026-11-18T07:30:00.000Z", ends_at: "2026-11-18T08:30:00.000Z", title: "Sam T.", status: "confirmed" }] },
    { instructor_id: "c", name: "Cara", working_hours: [], items: [{ kind: "private", id: null, starts_at: "2026-11-18T14:00:00.000Z", ends_at: "2026-11-18T15:00:00.000Z", title: "Private lesson" }] },
  ],
};

function detail(): RequestDetailResponse {
  return {
    request: summary(),
    candidates: [
      candidate({ instructor_id: "b", name: "Ben", recommended: true, miles: 0.5, distance_from: { kind: "previous_lesson", label: "Earlham Road, NR2", at: "2026-11-18T08:30:00.000Z" }, lessons_that_day: 1 }),
      candidate({ instructor_id: "a", name: "Anna", current: true, miles: 2.4, distance_from: { kind: "test_centre", label: "Norwich (Peachman Way)", at: null } }),
      candidate({ instructor_id: "c", name: "Cara", available: false, unavailable_reason: "busy" }),
    ],
    day: DAY,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

describe("request desk helpers", () => {
  it("reads London minutes from instants and wall-clock times, and words distances", () => {
    expect(londonMinutes("09:30")).toBe(570);
    // British Summer Time: 08:00Z is 09:00 in London.
    expect(londonMinutes("2026-07-01T08:00:00.000Z")).toBe(540);
    expect(londonMinutes("2026-11-18T10:00:00.000Z")).toBe(600);
    expect(milesText(0.5)).toBe("0.5 miles");
    expect(milesText(1)).toBe("1 mile");
    expect(milesText(12.4)).toBe("12 miles");
    expect(milesText(null)).toBeNull();
    expect(decisionText(summary({ decision: "sent", status: "confirmed", instructor: { id: "b", name: "Ben" } }))).toBe("Ben accepted");
    expect(decisionText(summary({ decision: "booked", status: "confirmed", instructor: { id: "b", name: "Ben" } }))).toBe("Booked with Ben");
  });
});

describe("RequestDesk", () => {
  it("pre-selects the recommended instructor and books with them", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ booking: { id: REQ }, decision: "book" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<RequestDesk data={detail()} />);
    expect(screen.getByText("Recommended")).toBeTruthy();
    expect(screen.getByText(/0.5 miles from their 08:30 drop-off \(Earlham Road, NR2\)/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Book with Ben" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Booked with Ben"));
    expect(fetchMock).toHaveBeenCalledWith(
      `/organisations/api/requests/${REQ}/decide`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ decision: "book", instructor_id: "b", organisation_id: ORG }) })
    );
  });

  it("sends to another chosen instructor, and explains a refusal in plain words", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ error: { code: "conflict", message: "x", details: { code: "slot_no_longer_free" } } }), { status: 409 })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<RequestDesk data={detail()} />);
    // Anna from the list (the day board offers her too).
    fireEvent.click(screen.getAllByRole("button", { name: /^Anna/ })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Ask Anna to accept" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("That instructor is no longer free then. Choose someone else."));
    expect(fetchMock).toHaveBeenCalledWith(
      `/organisations/api/requests/${REQ}/decide`,
      expect.objectContaining({ body: JSON.stringify({ decision: "send", instructor_id: "a", organisation_id: ORG }) })
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("offers nothing to book once the request has lapsed", () => {
    const data = detail();
    data.request = summary({ expired: true });
    render(<RequestDesk data={data} />);
    expect((screen.getByRole("button", { name: "Book with Ben" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/too close to the lesson/)).toBeTruthy();
  });
});

describe("SchoolDayBoard", () => {
  it("shows every instructor, a held request as waiting for the school, and private lessons without names", () => {
    const { container } = render(<SchoolDayBoard day={DAY} />);
    expect(screen.getByText("Anna")).toBeTruthy();
    expect(screen.getByText("Ben")).toBeTruthy();
    expect(screen.getByText("Cara")).toBeTruthy();
    expect(container.querySelector('[title^="Priya S."]')!.className).toContain("border-deep-rose");
    expect(container.querySelector('[title^="Private lesson"]')).not.toBeNull();
    expect(screen.getByText("Waiting for you")).toBeTruthy();
  });
});

describe("RequestsView", () => {
  function data(overrides: Partial<RequestsResponse> = {}): RequestsResponse {
    return {
      generated_at: "2026-11-16T08:00:00.000Z",
      organisations: [{ id: ORG, name: "Chilled Driving School", request_routing: "school" }],
      waiting: [summary()],
      decided: [summary({ id: "done", decision: "booked", status: "confirmed", decided_by: "Office", decided_at: "2026-11-15T10:00:00.000Z", instructor: { id: "b", name: "Ben" } })],
      ...overrides,
    };
  }

  it("lists what is waiting and what was decided", () => {
    render(<RequestsView data={data()} />);
    expect(screen.getByRole("link", { name: /Priya S\./ }).getAttribute("href")).toBe(`/organisations/requests/${REQ}`);
    expect(screen.getByText("Choose an instructor")).toBeTruthy();
    expect(screen.getByText(/Booked with Ben · by Office/)).toBeTruthy();
  });

  it("will not hand requests back to instructors while some are waiting, and says why", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "x", code: "requests_waiting" }), { status: 409 })));
    render(<RequestsView data={data()} />);
    fireEvent.click(screen.getByRole("radio", { name: "Instructors" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Book, send or decline the requests waiting below first."));
    expect(screen.getByRole("radio", { name: "The office" }).getAttribute("aria-checked")).toBe("true");
  });
});
