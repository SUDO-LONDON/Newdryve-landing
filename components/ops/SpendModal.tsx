"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaptureStatus, OpsExpense } from "@/lib/ops/types";
import { RECEIPT_ACCEPT, isAllowedReceipt } from "@/lib/ops/receipts";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type Source = "upload" | "phone";

// Add-spend dialog. A receipt is mandatory and can arrive two ways: a direct
// file upload, or a QR handoff where the receipt is photographed on a phone and
// this dialog polls until it lands.
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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [source, setSource] = useState<Source>("upload");
  const [file, setFile] = useState<File | null>(null);

  // Phone-capture handoff state.
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [captureToken, setCaptureToken] = useState<string | null>(null);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus | null>(null);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  async function generateQr() {
    setGenerating(true);
    setError(null);
    stopPolling();
    try {
      const res = await fetch("/ops/api/capture", { method: "POST" });
      const d = await res.json();
      if (!res.ok || !d.token) {
        setError(d.error ?? "Could not generate a QR code");
        return;
      }
      setCaptureToken(d.token);
      setQrSvg(d.qrSvg);
      setCaptureStatus("pending");
      pollRef.current = setInterval(async () => {
        const r = await fetch(`/ops/api/capture/${d.token}`, { cache: "no-store" });
        if (!r.ok) return;
        const s = (await r.json()) as { status?: CaptureStatus };
        if (s.status) setCaptureStatus(s.status);
        if (s.status === "received" || s.status === "expired") stopPolling();
      }, 2500);
    } finally {
      setGenerating(false);
    }
  }

  async function submit() {
    const amountNum = Number(amount);
    if (!description.trim()) return setError("Enter what the spend was for");
    if (!Number.isFinite(amountNum) || amountNum <= 0) return setError("Enter an amount greater than 0");

    if (source === "upload") {
      if (!file) return setError("Choose a receipt file, or switch to phone capture");
      if (!isAllowedReceipt(file.name)) return setError("Unsupported receipt type. Use a photo or PDF.");
    } else if (captureStatus !== "received" || !captureToken) {
      return setError("Scan the QR code and send the receipt from your phone first");
    }

    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("description", description.trim());
    form.set("amount", String(amountNum));
    if (category.trim()) form.set("category", category.trim());
    form.set("spent_on", spentOn);
    if (source === "upload" && file) form.set("receipt", file);
    if (source === "phone" && captureToken) form.set("capture_token", captureToken);

    const res = await fetch("/ops/api/expenses", { method: "POST", body: form });
    const d = await res.json();
    setBusy(false);
    if (d.expense) onDone(d.expense as OpsExpense);
    else setError(d.error ?? "Failed to record spend");
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active ? "bg-racing-green text-white" : "border border-border bg-white text-ink-secondary hover:bg-blush-surface"
    }`;

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
              Receipt <span className="text-deep-rose">*</span>
            </label>
            <div className="mb-3 flex gap-2">
              <button type="button" onClick={() => setSource("upload")} className={tabClass(source === "upload")}>
                Upload file
              </button>
              <button type="button" onClick={() => setSource("phone")} className={tabClass(source === "phone")}>
                Scan with phone
              </button>
            </div>

            {source === "upload" ? (
              <>
                <input
                  type="file"
                  accept={RECEIPT_ACCEPT}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-ink-muted">Required. A photo or PDF of the receipt.</p>
              </>
            ) : (
              <div className="rounded-lg border border-border bg-blush-surface p-4 text-center">
                {captureStatus === "received" ? (
                  <div>
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-racing-green text-white">
                      ✓
                    </div>
                    <p className="text-sm font-medium text-ink">Receipt received from your phone</p>
                    <button
                      type="button"
                      onClick={generateQr}
                      className="mt-2 text-xs text-racing-green hover:underline"
                    >
                      Scan a different one
                    </button>
                  </div>
                ) : qrSvg && captureStatus !== "expired" ? (
                  <div>
                    <div
                      className="mx-auto h-[180px] w-[180px] [&>svg]:h-full [&>svg]:w-full"
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                    <p className="mt-2 text-sm text-ink">Scan with your phone camera</p>
                    <p className="mt-1 text-xs text-ink-muted">Waiting for the photo… keep this open.</p>
                  </div>
                ) : captureStatus === "expired" ? (
                  <div>
                    <p className="text-sm text-ink">That code expired.</p>
                    <button
                      type="button"
                      onClick={generateQr}
                      disabled={generating}
                      className="mt-2 rounded-lg gradient-bg px-4 py-2 text-sm text-white disabled:opacity-60"
                    >
                      Generate a new code
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={generateQr}
                    disabled={generating}
                    className="rounded-lg gradient-bg px-4 py-2 text-sm text-white disabled:opacity-60"
                  >
                    {generating ? "Generating…" : "Generate QR code"}
                  </button>
                )}
              </div>
            )}
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
