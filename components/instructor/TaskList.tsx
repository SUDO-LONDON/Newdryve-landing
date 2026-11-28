"use client";

/**
 * The onboarding checklist and progress bar.
 *
 * Every state shown here comes from GET /v1/instructors/onboarding and nothing
 * is derived locally — the API owns the question of whose turn it is, so the
 * app and this page can never disagree about whether someone is live.
 *
 * The list is an overview, not where the work happens: each row is one line,
 * and the step being worked on is done in the card above it. Long per-step
 * explanations only appear where they change what the instructor should do
 * (waiting, locked, blocked), never on finished steps.
 */

import type { OnboardingTask } from "@/lib/instructor/backend";

const STATE_LABEL: Record<OnboardingTask["state"], string> = {
  done: "Done",
  todo: "To do",
  in_review: "With us",
  locked: "Later",
  blocked: "Blocked",
};

/** Colour is never the only signal: every icon has a matching word beside it. */
function StateIcon({ state, number }: { state: OnboardingTask["state"]; number: number }) {
  const base = "nd-marker nd-marker-sm";
  if (state === "done") {
    return (
      <span aria-hidden="true" className={`${base} nd-marker-done`}>
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (state === "in_review") {
    return (
      <span aria-hidden="true" className={`${base} nd-marker-quiet`}>
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7 4.2V7l1.9 1.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  if (state === "blocked") {
    return (
      <span aria-hidden="true" className={`${base} nd-marker-blocked`}>
        !
      </span>
    );
  }
  if (state === "locked") {
    return (
      <span aria-hidden="true" className={`${base} nd-marker-quiet`}>
        {number}
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={base}>
      {number}
    </span>
  );
}

export function StepList({
  tasks,
  focusedId,
  onFocus,
}: {
  tasks: OnboardingTask[];
  focusedId: string | null;
  onFocus: (task: OnboardingTask) => void;
}) {
  return (
    <ol className="nd-card divide-y-2 divide-dashed overflow-hidden px-4 sm:px-5">
      {tasks.map((task, index) => {
        const focused = task.id === focusedId;
        // Finished steps and the one already open above need no explanation;
        // the rest say why they are waiting so nobody has to guess.
        const showDetail = !focused && (task.state === "in_review" || task.state === "locked" || task.state === "blocked");
        const canOpen = !focused && task.state === "todo" && task.action !== null;

        return (
          <li
            key={task.id}
            aria-current={focused ? "step" : undefined}
            className={`flex items-start gap-3 py-3.5 ${focused ? "nd-row-current -mx-4 px-4 sm:-mx-5 sm:px-5" : ""} ${canOpen ? "items-center" : ""}`}
          >
            <StateIcon state={task.state} number={index + 1} />
            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={`text-[17px] leading-6 ${
                  task.state === "done"
                    ? "text-[var(--forest-soft)]"
                    : task.state === "blocked"
                      ? "font-semibold text-[var(--pink-ink)]"
                      : "font-semibold"
                }`}
              >
                {task.title}
              </p>
              {showDetail ? (
                <p className={`nd-help mt-0.5 ${task.state === "blocked" ? "text-[var(--pink-ink)]" : ""}`}>
                  {task.detail}
                </p>
              ) : null}
            </div>
            {canOpen ? (
              <button
                type="button"
                onClick={() => onFocus(task)}
                className="nd-btn-secondary min-h-11 shrink-0 px-5"
              >
                Start
                <span className="sr-only">: {task.title}</span>
              </button>
            ) : (
              <span
                className={`nd-chip mt-1 ${
                  focused
                    ? "nd-chip-forest"
                    : task.state === "done"
                      ? "nd-chip-mint"
                      : task.state === "blocked"
                        ? "nd-chip-pink text-[var(--pink-ink)]"
                        : ""
                }`}
              >
                {focused ? "Now" : STATE_LABEL[task.state]}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** How far along, said once at the top so the list does not have to be counted. */
export function StepProgress({ tasks }: { tasks: OnboardingTask[] }) {
  const done = tasks.filter((task) => task.state === "done").length;
  const total = tasks.length;

  return (
    <div className="mt-5">
      <p className="nd-small-label">
        {done} of {total} steps done
      </p>
      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Setup progress"
        className="mt-2.5 flex gap-2"
      >
        {tasks.map((task) => (
          <span
            key={task.id}
            data-state={task.state === "done" || task.state === "blocked" ? task.state : undefined}
            className="nd-rail-step"
          />
        ))}
      </div>
    </div>
  );
}
