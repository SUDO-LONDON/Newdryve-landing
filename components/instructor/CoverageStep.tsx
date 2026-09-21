"use client";

/**
 * The instructor's first service area.
 *
 * Their test centres came from the application and are shown, not chosen —
 * this step only asks how far they will travel outward from them, which is the
 * same question the app's first-run screen asks (CoverageSetup2.js).
 *
 * Both units are offered because neither works everywhere: a rural instructor
 * thinks in miles driving out to villages, while ten miles across London is
 * ninety minutes and would claim the whole city. The server suggests which
 * leads, from how tightly the centres cluster, so most people never touch the
 * toggle.
 */

import { useState } from "react";
import type { CoverageState } from "@/lib/instructor/backend";

const MILE_OPTIONS = [5, 10, 15, 20, 30];
const MINUTE_OPTIONS = [15, 20, 30, 45, 60];

export function CoverageStep({
  coverage,
  busy,
  error,
  onSave,
  onCancel,
}: {
  coverage: CoverageState;
  busy: boolean;
  error: string | null;
  onSave: (mode: "miles" | "minutes", value: number) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<"miles" | "minutes">(coverage.suggested_mode);
  const [value, setValue] = useState<number>(coverage.suggested_value);

  const options = mode === "minutes" ? MINUTE_OPTIONS : MILE_OPTIONS;
  const unit = mode === "minutes" ? "min" : "mi";

  // Switching unit must not carry a number that means something else — 30
  // miles and 30 minutes are not the same promise to a learner.
  const switchMode = (next: "miles" | "minutes") => {
    if (next === mode) return;
    setMode(next);
    setValue(next === "minutes" ? 30 : 10);
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-[0_20px_50px_-30px_rgba(10,10,20,0.22)] sm:p-8">
      <h2 className="font-display text-2xl text-ink">Set your service area</h2>

      {coverage.centres.length > 0 ? (
        <>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            You told us you cover{" "}
            <span className="font-semibold text-ink">
              {coverage.centres.map((c) => c.name).join(", ")}
            </span>
            . How far will you travel from there to pick a learner up?
          </p>
        </>
      ) : (
        // Without centres the API would reject the save, so say so plainly
        // rather than presenting a control that cannot work.
        <p className="mt-2 text-sm leading-6 text-ink-secondary">
          We don&rsquo;t have any test centres on your application yet. Email{" "}
          <a className="font-semibold underline" href="mailto:support@newdryve.com">
            support@newdryve.com
          </a>{" "}
          and we&rsquo;ll add them for you.
        </p>
      )}

      {coverage.centres.length > 0 ? (
        <>
          <div
            role="radiogroup"
            aria-label="Measure your travel in"
            className="mt-6 inline-flex rounded-full border border-border p-1"
          >
            {(["miles", "minutes"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={mode === option}
                onClick={() => switchMode(option)}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === option ? "bg-racing-green text-white" : "text-ink-secondary"
                }`}
              >
                {option === "miles" ? "Distance" : "Drive time"}
              </button>
            ))}
          </div>

          <div role="radiogroup" aria-label="How far you will travel" className="mt-5 flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={value === option}
                onClick={() => setValue(option)}
                className={`focus-ring min-w-[72px] rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  value === option
                    ? "border-racing-green bg-racing-green text-white"
                    : "border-border text-ink"
                }`}
              >
                {option} {unit}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs leading-5 text-ink-muted">
            This only limits where you&rsquo;ll collect a learner from. You can change it
            any time from the Newdryve app.
          </p>

          {error ? (
            <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onSave(mode, value)}
              disabled={busy}
              className="focus-ring inline-flex h-11 items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save service area"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="focus-ring inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-ink disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
