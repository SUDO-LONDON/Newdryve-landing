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
});
