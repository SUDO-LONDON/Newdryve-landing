"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RECEIPT_ACCEPT, isAllowedReceipt } from "@/lib/ops/receipts";
import type { CaptureStatus } from "@/lib/ops/types";

type Phase = "loading" | "invalid" | "expired" | "ready" | "uploading" | "done";

// The phone side of the QR handoff. Opens the rear camera, previews the shot,
// and uploads it against the session token.
export default function MobileReceiptCapture({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial token check.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/ops/api/capture/${token}`, { cache: "no-store" });
        if (!active) return;
        if (res.status === 404) return setPhase("invalid");
        const d = (await res.json()) as { status?: CaptureStatus };
        if (d.status === "expired") setPhase("expired");
        else if (d.status === "used") setPhase("done");
        else setPhase("ready");
      } catch {
        if (active) setPhase("invalid");
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  // Derive the preview URL from the file; revoke it on change/unmount.
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function choose(f: File | null) {
    setError(null);
    if (f && !isAllowedReceipt(f.name)) {
      setError("That file type isn't supported. Use a photo or PDF.");
      return;
    }
    setFile(f);
  }

  async function upload() {
    if (!file) return;
    setPhase("uploading");
    setError(null);
    const form = new FormData();
    form.set("receipt", file);
    try {
      const res = await fetch(`/ops/api/capture/${token}`, { method: "POST", body: form });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        setPhase("done");
      } else {
        setError(d.error ?? "Upload failed");
        setPhase("ready");
      }
    } catch {
      setError("Network error — try again");
      setPhase("ready");
    }
  }

  if (phase === "loading") {
    return <p className="text-center text-sm text-ink-muted">Checking link…</p>;
  }

  if (phase === "invalid" || phase === "expired") {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        <p className="font-display text-lg text-ink">
          {phase === "expired" ? "This link has expired" : "This link isn't valid"}
        </p>
        <p className="mt-2 text-sm text-ink-secondary">
          Generate a fresh QR code from the dashboard on your laptop and scan it again.
        </p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-racing-green text-white">
          ✓
        </div>
        <p className="font-display text-lg text-ink">Receipt sent</p>
        <p className="mt-2 text-sm text-ink-secondary">
          Head back to your laptop to finish saving the spend. You can close this tab.
        </p>
        <button
          onClick={() => {
            setFile(null);
            setPhase("ready");
          }}
          className="mt-4 text-sm text-racing-green hover:underline"
        >
          Take another
        </button>
      </div>
    );
  }

  // ready / uploading
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      {preview ? (
        <div className="mb-4">
          {file?.type === "application/pdf" ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-blush-surface text-sm text-ink-secondary">
              {file.name}
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Receipt preview" className="max-h-64 w-full rounded-xl object-contain" />
          )}
        </div>
      ) : (
        <p className="mb-4 text-center text-sm text-ink-secondary">
          Take a clear photo of the receipt.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={RECEIPT_ACCEPT}
        capture="environment"
        onChange={(e) => choose(e.target.files?.[0] ?? null)}
        className="hidden"
      />

      {error && <p className="mb-3 text-center text-sm text-deep-rose">{error}</p>}

      <div className="flex flex-col gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={phase === "uploading"}
          className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-ink disabled:opacity-60"
        >
          {file ? "Retake / choose another" : "Open camera"}
        </button>
        <button
          onClick={upload}
          disabled={!file || phase === "uploading"}
          className="rounded-xl gradient-bg px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {phase === "uploading" ? "Sending…" : "Send receipt"}
        </button>
      </div>
    </div>
  );
}
