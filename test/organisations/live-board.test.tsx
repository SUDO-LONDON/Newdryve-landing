import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LiveBoard, { requestsWaiting } from "@/components/organisations/LiveBoard";
import { liveInstructor } from "../fixtures";

describe("LiveBoard", () => {
  it("shows a sick day as Off sick, never the raw code", () => {
    const { container } = render(
      <LiveBoard
        initial={{ generated_at: "2026-10-20T10:00:00.000Z", date: "2026-10-20", organisations: [], instructors: [liveInstructor()] }}
      />
    );
    expect(screen.getByText("Off sick until 17:00")).toBeTruthy();
    expect(container.querySelector('[title^="Off sick "]')).not.toBeNull();
    expect(container.innerHTML).not.toContain("sick_day");
  });

  it("never mentions clocking in or out (ADR-057), even when the API still sends a clock", () => {
    const instructor = liveInstructor();
    instructor.status.clock = { date: "2026-10-20", state: "out", first_in_at: "2026-10-20T08:00:00.000Z", last_out_at: "2026-10-20T09:00:00.000Z", clocked_minutes: 60 };
    const { container } = render(
      <LiveBoard initial={{ generated_at: "2026-10-20T10:00:00.000Z", date: "2026-10-20", organisations: [], instructors: [instructor] }} />
    );
    expect(container.textContent?.toLowerCase()).not.toContain("clock");
  });

  it("shows a booked lesson whose end has passed as Not started", () => {
    const instructor = liveInstructor({
      lessons_today: [
        { id: "b1", starts_at: "2026-10-20T08:00:00.000Z", ends_at: "2026-10-20T09:00:00.000Z", status: "confirmed", learner_name: "Pat" },
        { id: "b2", starts_at: "2026-10-20T11:00:00.000Z", ends_at: "2026-10-20T12:00:00.000Z", status: "confirmed", learner_name: "Lee" },
      ],
    });
    render(<LiveBoard initial={{ generated_at: "2026-10-20T10:00:00.000Z", date: "2026-10-20", organisations: [], instructors: [instructor] }} />);
    expect(screen.getByText("Not started")).toBeTruthy();
    expect(screen.getByText("Booked")).toBeTruthy();
  });
});

describe("LiveBoard requests and WhatsApp (ADR-071)", () => {
  const board = (overrides: Parameters<typeof liveInstructor>[0]) =>
    render(
      <LiveBoard
        initial={{ generated_at: "2026-10-20T10:00:00.000Z", date: "2026-10-20", organisations: [], instructors: [liveInstructor(overrides)] }}
      />
    );

  it("says how many requests are waiting and for how long", () => {
    expect(requestsWaiting({ count: 1, oldest_at: "2026-10-20T09:20:00.000Z" }, Date.parse("2026-10-20T10:00:00.000Z"))).toBe("1 request waiting · 40 min");
    expect(requestsWaiting({ count: 3, oldest_at: "2026-10-20T06:30:00.000Z" }, Date.parse("2026-10-20T10:00:00.000Z"))).toBe("3 requests waiting · oldest 3 h");
    expect(requestsWaiting({ count: 2, oldest_at: "2026-10-17T10:00:00.000Z" }, Date.parse("2026-10-20T10:00:00.000Z"))).toBe("2 requests waiting · oldest 3 days");
    expect(requestsWaiting({ count: 0, oldest_at: null }, Date.now())).toBeNull();
    expect(requestsWaiting(undefined, Date.now())).toBeNull();
  });

  it("shows the WhatsApp pill and this morning's diary check, never the conversation", () => {
    const { container } = board({
      pending_requests: { count: 2, oldest_at: "2026-10-20T07:00:00.000Z" },
      assistant: { linked: true, diary_confirmed_at: "2026-10-20T06:04:00.000Z" },
    });
    expect(screen.getByText("WhatsApp")).toBeTruthy();
    expect(screen.getByText(/Diary checked 07:04/)).toBeTruthy();
    expect(container.textContent).toMatch(/2 requests waiting/);
  });

  it("an instructor without WhatsApp and nothing waiting shows neither", () => {
    const { container } = board({ pending_requests: { count: 0, oldest_at: null }, assistant: { linked: false, diary_confirmed_at: null } });
    expect(container.textContent).not.toMatch(/WhatsApp|waiting|Diary/);
  });
});
