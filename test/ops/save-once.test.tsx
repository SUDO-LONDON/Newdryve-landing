import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OpsBoard, OpsField } from "@/lib/ops/types";

const { default: NewItemModal } = await import("@/components/ops/NewItemModal");
const { default: FinancePanel } = await import("@/components/ops/FinancePanel");
const { default: ItemDrawer } = await import("@/components/ops/ItemDrawer");

// A press that saves must save once, however many times it is pressed while
// the server is still answering (the double-saved items on the boards).

const board: OpsBoard = { id: "learners", module: "customer_outreach", name: "Learner Pipeline", description: null, stages: ["New"], position: 0 };
const fields: OpsField[] = [
  { id: "f1", board_id: "learners", key: "name", label: "Name", type: "text", options: null, required: true, is_sensitive: false, note: null, position: 0 },
];

type Deferred = { resolve: () => void };
function pending(): { promise: Promise<void>; handle: Deferred } {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, handle: { resolve } };
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("saving once", () => {
  it("New item: pressing Create twice while the server is slow creates one item", async () => {
    const slow = pending();
    const onCreate = vi.fn(() => slow.promise);
    render(<NewItemModal board={board} fields={fields} founders={[]} onCancel={() => {}} onCreate={onCreate} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Priya" } });
    const create = screen.getByRole("button", { name: "Create" });
    fireEvent.click(create);
    fireEvent.click(create);
    fireEvent.click(screen.getByRole("button", { name: "Creating…" }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    await act(async () => slow.handle.resolve());
    await waitFor(() => expect(screen.getByRole("button", { name: "Create" })).toBeTruthy());
  });

  it("New item: a missing required field is said, not sent", () => {
    const onCreate = vi.fn();
    render(<NewItemModal board={board} fields={fields} founders={[]} onCancel={() => {}} onCreate={onCreate} />);
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByRole("alert").textContent).toBe("Name is required");
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("Money: pressing Save on the funding total twice sends one request", async () => {
    const slow = pending();
    const fetchMock = vi.fn(async () => {
      await slow.promise;
      return new Response(JSON.stringify({ fundingPence: 1_000_00 }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<FinancePanel initialFundingPence={0} initialExpenses={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "1000" } });
    const save = screen.getByRole("button", { name: "Save" });
    fireEvent.click(save);
    fireEvent.click(save);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => slow.handle.resolve());
    await waitFor(() => expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy());
    // Total funding and remaining both show the new figure.
    expect(screen.getAllByText("£1,000.00")).toHaveLength(2);
  });

  it("Notes: pressing Add twice posts one note", async () => {
    const slow = pending();
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push(`${init?.method ?? "GET"} ${url}`);
        if (url === "/ops/api/notes") {
          await slow.promise;
          return new Response(JSON.stringify({ note: { id: "n1", item_id: "i1", author_email: "f@x", body: "Called them", created_at: "2026-11-04T10:00:00Z" } }), { status: 200 });
        }
        return new Response(JSON.stringify({ item: { id: "i1", board_id: "learners", stage: "New", owner_email: null, next_action: null, next_action_date: null, data: { name: "Priya" }, created_by: null, created_at: "2026-11-04T09:00:00Z", updated_at: "2026-11-04T09:00:00Z", deleted_at: null }, notes: [], activity: [] }), { status: 200 });
      })
    );
    render(<ItemDrawer board={board} fields={fields} founders={[]} itemId="i1" onClose={() => {}} onSaved={() => {}} onDeleted={() => {}} />);
    await screen.findByPlaceholderText("Add a note…");
    fireEvent.change(screen.getByPlaceholderText("Add a note…"), { target: { value: "Called them" } });
    const add = screen.getByRole("button", { name: "Add" });
    fireEvent.click(add);
    fireEvent.click(add);
    expect(calls.filter((c) => c === "POST /ops/api/notes")).toHaveLength(1);
    await act(async () => slow.handle.resolve());
    await waitFor(() => expect(screen.getByText("Called them", { selector: "p" })).toBeTruthy());
  });
});
