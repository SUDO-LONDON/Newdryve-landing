"use client";

import { useState } from "react";
import type { OpsExpense } from "@/lib/ops/types";

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "heic", "heif", "pdf"];

function extensionOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i + 1).toLowerCase();
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Add-spend dialog. A receipt photo is mandatory: the form blocks submission
// until one is chosen, and the API rejects the request without it.
export default function SpendModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (expense: OpsExpense) => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [spentOn, setSpentOn] = useState(todayISO());
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const amountNum = Number(amount);
    if (!description.trim()) return setError("Enter what the spend was for");
    if (!Number.isFinite(amountNum) || amountNum <= 0) return setError("Enter an amount greater than 0");
    if (!file) return setError("A receipt photo is required");
    const ext = extensionOf(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return setError(`Unsupported receipt type .${ext || "?"}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
    }

    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("description", description.trim());
    form.set("amount", String(amountNum));
    if (category.trim()) form.set("category", category.trim());
    form.set("spent_on", spentOn);
    form.set("receipt", file);

    const res = await fetch("/ops/api/expenses", { method: "POST", body: form });
    const d = await res.json();
    setBusy(false);
    if (d.expense) onDone(d.expense as OpsExpense);
    else setError(d.error ?? "Failed to record spend");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-border p-5 shadow-xl">
        <h2 className="font-display text-xl text-ink mb-4">Record spend</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">What was it for?</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Domain renewal"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Amount (£)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Date</label>
              <input
                type="date"
                value={spentOn}
                max={todayISO()}
                onChange={(e) => setSpentOn(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Category (optional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Software, Marketing, Legal"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Receipt photo <span className="text-deep-rose">*</span>
            </label>
            <input
              type="file"
              accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Required. Allowed: {ALLOWED_EXTENSIONS.join(", ")}
            </p>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-deep-rose">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-ink hover:bg-blush-surface"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="rounded-lg gradient-bg px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save spend"}
          </button>
        </div>
      </div>
    </div>
  );
}
