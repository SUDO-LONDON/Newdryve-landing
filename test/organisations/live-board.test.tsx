import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LiveBoard from "@/components/organisations/LiveBoard";
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
