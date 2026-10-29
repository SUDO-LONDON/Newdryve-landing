import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NotificationBell from "@/components/organisations/NotificationBell";
import { notificationKindLabel, type OrganisationNotification } from "@/lib/organisations/types";

const note = (id: string, kind: string, title: string, body: string): OrganisationNotification => ({
  id, organisation_id: "org-1", kind, instructor_id: "i-1", title, body, created_at: "2026-10-29T09:15:00.000Z", read_at: null,
});

const items = [
  note("n1", "instructor_sick_day", "Sam Carter is off sick", "Sam Carter called in sick for Thu 29 Oct. 2 lessons were cancelled and the learners have been told. Nobody is charged."),
  note("n2", "lesson_cancelled_by_instructor", "Sam Carter cancelled a lesson at short notice", "Sam Carter cancelled the lesson on Thu 29 Oct at 10:00 less than 30 minutes before it started. The learner has been told and is not charged."),
  note("n3", "lesson_no_show", "Sam Carter recorded a no-show", "Sam Carter recorded that the learner did not turn up for the lesson on Wed 28 Oct at 15:00."),
  note("n4", "instructor_joined", "Ria Shah joined your organisation", "Ria Shah joined on 27 Oct 2026."),
  note("n5", "something_new", "A future event", "Shown as it comes."),
];

afterEach(() => vi.unstubAllGlobals());

describe("NotificationBell (QA L16)", () => {
  it("labels the new kinds plainly", () => {
    expect(notificationKindLabel("instructor_sick_day")).toBe("Off sick");
    expect(notificationKindLabel("lesson_cancelled_by_instructor")).toBe("Lesson cancelled");
    expect(notificationKindLabel("lesson_no_show")).toBe("No-show");
    expect(notificationKindLabel("instructor_left")).toBe("Left");
    expect(notificationKindLabel("something_new")).toBeNull();
  });

  it("renders sick days, instructor cancellations and no-shows with a tag, title and body, never the raw kind", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ items, unread_count: 5, next_offset: null }), {
      status: 200, headers: { "content-type": "application/json" },
    })));
    const { container } = render(<NotificationBell />);
    const bell = await screen.findByRole("button", { name: "Notifications, 5 unread" });
    fireEvent.click(bell);
    const panel = screen.getByRole("dialog", { name: "Notifications" });
    const rows = within(panel).getAllByRole("listitem");
    expect(rows.map((row) => row.querySelector("span.uppercase")?.textContent ?? null))
      .toEqual(["Off sick", "Lesson cancelled", "No-show", "Joined", null]);
    expect(within(panel).getByText("Sam Carter is off sick")).toBeTruthy();
    expect(within(panel).getByText(/2 lessons were cancelled and the learners have been told/)).toBeTruthy();
    expect(within(panel).getByText("Sam Carter cancelled a lesson at short notice")).toBeTruthy();
    expect(within(panel).getByText("Sam Carter recorded a no-show")).toBeTruthy();
    expect(within(panel).getByText("A future event")).toBeTruthy();
    for (const raw of ["instructor_sick_day", "lesson_cancelled_by_instructor", "lesson_no_show", "something_new"]) {
      expect(container.innerHTML).not.toContain(raw);
    }
  });
});
