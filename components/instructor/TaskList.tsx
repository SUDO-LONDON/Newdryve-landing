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
  const base = "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold";
  if (state === "done") {
    return (
      <span aria-hidden="true" className={`${base} bg-racing-green text-white`}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (state === "in_review") {
    return (
      <span aria-hidden="true" className={`${base} border border-border bg-white text-ink-secondary`}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 4.2V7l1.9 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  if (state === "blocked") {
    return (
      <span aria-hidden="true" className={`${base} bg-rose-50 text-rose-700`}>
        !
      </span>
    );
  }
  if (state === "locked") {
    return (
      <span aria-hidden="true" className={`${base} border border-border text-ink-secondary`}>
        {number}
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={`${base} bg-deep-rose text-white`}>
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
    <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white px-4">
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
            className={`flex items-start gap-3 py-3 ${focused ? "-mx-4 bg-blush-surface px-4" : ""} ${canOpen ? "items-center" : ""}`}
          >
            <StateIcon state={task.state} number={index + 1} />
            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={`text-[15px] leading-6 ${
                  task.state === "done"
                    ? "text-ink-secondary"
                    : task.state === "blocked"
                      ? "font-semibold text-rose-800"
                      : "font-semibold text-ink"
                }`}
              >
                {task.title}
              </p>
              {showDetail ? (
                <p className={`mt-0.5 text-[13px] leading-5 ${task.state === "blocked" ? "text-rose-800" : "text-ink-secondary"}`}>
                  {task.detail}
                </p>
              ) : null}
            </div>
            {canOpen ? (
              <button
                type="button"
                onClick={() => onFocus(task)}
                className="focus-ring inline-flex min-h-11 shrink-0 items-center rounded-full border border-racing-green px-4 text-sm font-bold text-racing-green hover:bg-canvas"
              >
                Start
                <span className="sr-only">: {task.title}</span>
              </button>
            ) : (
              <span
                className={`mt-1 shrink-0 text-[11px] font-bold uppercase tracking-[0.5px] ${
                  focused
                    ? "text-deep-rose-ink"
                    : task.state === "done"
                      ? "text-racing-green"
                      : task.state === "blocked"
                        ? "text-rose-800"
                        : "text-ink-secondary"
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
      <p className="text-sm font-semibold text-ink">
        {done} of {total} steps done
      </p>
      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Setup progress"
        className="mt-2 flex gap-1"
      >
        {tasks.map((task) => (
          <span
            key={task.id}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              task.state === "done" ? "bg-racing-green" : task.state === "blocked" ? "bg-rose-400" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
