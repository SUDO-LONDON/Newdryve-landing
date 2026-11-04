"use client";

import { useState } from "react";
import type { Founder, OpsBoard, OpsField } from "@/lib/ops/types";
import FieldInput from "@/components/ops/FieldInput";

// The "+ New" dialog for a board. Create runs once: the button is disabled
// from the first press until the server has answered, so a second press (or
// a slow network) cannot make the same item twice.
export default function NewItemModal({
  board,
  fields,
  founders,
  onCancel,
  onCreate,
}: {
  board: OpsBoard;
  fields: OpsField[];
  founders: Founder[];
  onCancel: () => void;
  /** Resolves when the server has answered, whether or not it created the item. */
  onCreate: (values: Record<string, unknown>) => Promise<unknown> | void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.key === "stage") init[f.key] = board.stages[0] ?? "";
      else if (f.type === "boolean") init[f.key] = false;
      else init[f.key] = "";
    }
    return init;
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    for (const f of fields) {
      if (f.required && !values[f.key]) {
        setError(`${f.label} is required`);
        return;
      }
    }
    setError(null);
    setBusy(true);
    try {
      await onCreate(values);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/30" onClick={busy ? undefined : onCancel} aria-hidden />
      <div
        role="dialog"
        aria-labelledby="new-item-title"
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-border p-5 shadow-xl"
      >
        <h2 id="new-item-title" className="font-display text-xl text-ink mb-4">
          New — {board.name}
        </h2>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-ink mb-1">
                {f.label}
                {f.required && <span className="text-deep-rose"> *</span>}
              </label>
              <FieldInput
                field={f}
                board={board}
                founders={founders}
                value={values[f.key]}
                onChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))}
              />
            </div>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-deep-rose">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-border px-4 py-2 text-sm text-ink hover:bg-blush-surface disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-lg gradient-bg px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
