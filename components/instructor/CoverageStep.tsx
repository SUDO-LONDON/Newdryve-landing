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
 *
 * Rendered inside the hub's current-step card, so the controls are on screen
 * as soon as the step is reached rather than behind a button and a scroll.
 */

import { useState } from "react";
import type { CoverageState } from "@/lib/instructor/backend";

const MILE_OPTIONS = [5, 10, 15, 20, 30];
const MINUTE_OPTIONS = [15, 20, 30, 45, 60];

export function CoverageStep({
  coverage,
  busy,
  onSave,
}: {
  coverage: CoverageState;
  busy: boolean;
  onSave: (mode: "miles" | "minutes", value: number) => void;
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

  // Without centres the API would reject the save, so say so plainly rather
  // than presenting a control that cannot work.
  if (coverage.centres.length === 0) {
    return (
      <p className="mt-4 text-sm leading-6 text-ink-secondary">
        We don&rsquo;t have any test centres on your application yet. Email{" "}
        <a className="font-semibold underline" href="mailto:support@newdryve.com">
          support@newdryve.com
        </a>{" "}
        and we&rsquo;ll add them for you.
      </p>
    );
  }

  return (
    <div className="mt-5">
      <p className="text-xs font-bold uppercase tracking-[0.5px] text-ink-secondary">Your test centres</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {coverage.centres.map((centre) => (
          <li key={centre.slug} className="rounded-full bg-canvas px-3 py-1 text-[13px] font-semibold text-ink">
            {centre.name}
          </li>
        ))}
      </ul>

      <p id="coverage-distance-label" className="mt-6 text-[15px] font-semibold leading-6 text-ink">
        How far will you travel to pick up a learner?
      </p>
      {/* Full width on a phone so each half is an easy thumb target. */}
      <div
        role="radiogroup"
        aria-label="Measure your travel in"
        className="mt-3 grid grid-cols-2 rounded-full border border-border p-1 sm:inline-grid"
      >
          {(["miles", "minutes"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={mode === option}
              onClick={() => switchMode(option)}
              className={`focus-ring min-h-11 rounded-full px-5 text-sm font-bold transition-colors ${
                mode === option ? "bg-racing-green text-white" : "text-ink-secondary"
              }`}
            >
              {option === "miles" ? "Distance" : "Drive time"}
            </button>
          ))}
      </div>

      <div role="radiogroup" aria-labelledby="coverage-distance-label" className="mt-3 grid grid-cols-5 gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => setValue(option)}
            className={`focus-ring min-h-12 rounded-xl border text-[15px] font-semibold transition-colors ${
              value === option
                ? "border-racing-green bg-racing-green text-white"
                : "border-border text-ink hover:bg-canvas"
            }`}
          >
            {option}
            <span className="ml-0.5 text-xs font-medium opacity-80">{unit}</span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-[13px] leading-5 text-ink-secondary">
        Only limits where you&rsquo;ll collect learners from. You can change it later in the app.
      </p>

      <button
        type="button"
        onClick={() => onSave(mode, value)}
        disabled={busy}
        className="focus-ring mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Saving…" : `Save ${value} ${mode === "minutes" ? "minute" : "mile"} area`}
      </button>
    </div>
  );
}
