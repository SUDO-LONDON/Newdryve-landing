import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OpsBoard, OpsField } from "@/lib/ops/types";

const { default: Board } = await import("@/components/ops/Board");

// The Video ideas board is for dumping ideas as they come: one line, Enter,
// and it is on the board in the first column. Boards whose new items need
// more than a name keep the dialog only.

const ideas: OpsBoard = {
  id: "ideas",
  module: "marketing_outreach",
  name: "Video ideas",
  description: null,
  stages: ["Idea", "Worth doing", "Posted"],
  position: 4,
};
const field = (key: string, type: OpsField["type"], required: boolean, position: number): OpsField => ({
  id: `f-${key}`,
  board_id: "ideas",
  key,
  label: key[0]!.toUpperCase() + key.slice(1),
  type,
  options: null,
  required,
  is_sensitive: false,
  note: null,
  position,
});
const ideaFields = [field("title", "text", true, 1), field("hook", "longtext", false, 2), field("stage", "stage", true, 3)];

function stubCreate() {
  const bodies: Array<Record<string, unknown>> = [];
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/ops/api/items" && init?.method === "POST") {
        const body = JSON.parse(String(init.body)) as Record<string, unknown>;
        bodies.push(body);
        await gate;
        const values = body.values as Record<string, unknown>;
        return new Response(
          JSON.stringify({
            item: { id: `i${bodies.length}`, board_id: "ideas", stage: values.stage ?? null, owner_email: null, next_action: null, next_action_date: null, data: { title: values.title }, created_by: null, created_at: "2026-11-04T09:00:00Z", updated_at: "2026-11-04T09:00:00Z", deleted_at: null },
          }),
          { status: 200 }
        );
      }
      return new Response("{}", { status: 200 });
    })
  );
  return { bodies, release: () => release() };
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("quick add on a board", () => {
  it("Enter adds the idea to the first column, once, and clears the line", async () => {
    const { bodies, release } = stubCreate();
    render(<Board board={ideas} fields={ideaFields} founders={[]} initialItems={[]} initialView={null} moduleName="Marketing" />);
    const line = screen.getByPlaceholderText("Got an idea? Type it and press Enter") as HTMLInputElement;
    fireEvent.change(line, { target: { value: "Instructor reacts to learner's first roundabout" } });
    fireEvent.submit(line.closest("form")!);
    fireEvent.submit(line.closest("form")!);
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toEqual({ board_id: "ideas", values: { title: "Instructor reacts to learner's first roundabout", stage: "Idea" } });
    await act(async () => release());
    await waitFor(() => expect(line.value).toBe(""));
    expect(screen.getByText("Instructor reacts to learner's first roundabout")).toBeTruthy();
  });

  it("is not offered when a new item needs more than its name", () => {
    stubCreate();
    const fields = [...ideaFields, field("platform", "select", true, 4)];
    render(<Board board={ideas} fields={fields} founders={[]} initialItems={[]} initialView={null} />);
    expect(screen.queryByPlaceholderText(/press Enter/)).toBeNull();
    expect(screen.getByRole("button", { name: "+ New" })).toBeTruthy();
  });
});
