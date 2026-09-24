"use client";

/**
 * The onboarding task list.
 *
 * Every state shown here comes from GET /v1/instructors/onboarding and nothing
 * is derived locally — the API owns the question of whose turn it is, so the
 * app and this page can never disagree about whether someone is live.
 */

import type { OnboardingTask } from "@/lib/instructor/backend";

const STATE_STYLE: Record<
  OnboardingTask["state"],
  { label: string; dot: string; chip: string }
> = {
  done: {
    label: "Done",
    dot: "bg-racing-green",
    chip: "bg-emerald-50 text-emerald-900",
  },
  todo: {
    label: "Your turn",
    dot: "bg-deep-rose",
    chip: "bg-blush-surface text-deep-rose-ink",
  },
  in_review: {
    label: "With us",
    dot: "bg-ink-muted",
    chip: "bg-canvas text-ink-secondary",
  },
  locked: {
    label: "Next up",
    dot: "bg-border",
    chip: "bg-canvas text-ink-muted",
  },
  blocked: {
    label: "Blocked",
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-800",
  },
};

export function TaskRow({
  task,
  busy,
  onAction,
}: {
  task: OnboardingTask;
  busy: boolean;
  onAction: (task: OnboardingTask) => void;
}) {
  const style = STATE_STYLE[task.state];
  const actionable = task.action !== null && task.state !== "done";

  return (
    <li className="flex gap-4 border-b border-border py-5 last:border-b-0">
      {/* A dot alone would carry the state in colour only, so the chip below
          repeats it in words — the same reason the list is not a traffic light. */}
      <span
        aria-hidden="true"
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3
            className={`text-[15px] font-semibold ${
              task.state === "done" ? "text-ink-secondary" : "text-ink"
            }`}
          >
            {task.title}
          </h3>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.5px] ${style.chip}`}
          >
            {style.label}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-6 text-ink-secondary">{task.detail}</p>

        {/* Every action is completable here. Nothing in this list sends the
            instructor to the app — that was the gap that stopped onboarding
            being finishable on the web at all. */}
        {actionable ? (
          <button
            type="button"
            onClick={() => onAction(task)}
            disabled={busy}
            className="focus-ring mt-3 inline-flex h-10 items-center justify-center rounded-full bg-racing-green px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
          >
            {busy
              ? "Working…"
              : task.action === "membership_checkout"
                ? "Set up membership"
                : task.action === "coverage"
                  ? "Set service area"
                  : task.action === "review_listing"
                    ? "Review listing"
                  : "Continue Stripe setup"}
          </button>
        ) : null}
      </div>
    </li>
  );
}

/** How far along, said once at the top so the list does not have to be counted. */
export function Progress({ tasks }: { tasks: OnboardingTask[] }) {
  const done = tasks.filter((task) => task.state === "done").length;
  const total = tasks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-ink">
          {done} of {total} done
        </p>
        <p className="text-sm text-ink-muted">{pct}%</p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Onboarding progress"
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-canvas"
      >
        <div
          className="h-full rounded-full bg-racing-green transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
