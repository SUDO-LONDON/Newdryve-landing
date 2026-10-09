"use client";

/**
 * The instructor onboarding hub.
 *
 * One page an instructor can keep open from approval to going live, replacing
 * a chain of four emails each of which was the only way to reach one step.
 *
 * The token in the URL is the credential: an instructor mid-onboarding is
 * deliberately banned from signing in until Stripe confirms their membership,
 * so a session is not available to authenticate this page.
 *
 * Membership and payouts are started from here and finished in Stripe.
 * Membership leaves for hosted Checkout and returns; payouts mount Stripe's
 * embedded form inline, so that step never leaves Newdryve.
 *
 * Layout: one card at the top holds the step to do now, and the step is done
 * inside that card. The checklist below is a one-line-per-step overview. The
 * earlier version opened each step as a new card under a seven-item list, so
 * an instructor pressed a button and then had to scroll to find what it did.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { OnboardingState, OnboardingTask } from "@/lib/instructor/backend";
import { Shell, Wordmark } from "@/components/instructor/Shell";
import { StepList, StepProgress } from "@/components/instructor/TaskList";
import { CoverageStep } from "@/components/instructor/CoverageStep";
import { ListingSummary, ReviewStep } from "@/components/instructor/ReviewStep";
import { APP_URL } from "@/lib/env";
import { SETUP_PAGE_KEY } from "@/lib/instructor/setup-page";

/** Long enough not to hammer the API, short enough to catch a Stripe webhook. */
const POLL_MS = 15_000;

/**
 * Stripe Checkout always returns to /instructors/activate, which on its own
 * can only say "check your inbox". On a phone that means leaving for the mail
 * app to find this page again, so the way back is left in this tab's session
 * storage (gone when the tab closes) for that page to offer.
 */
function rememberSetupPage() {
  try {
    sessionStorage.setItem(SETUP_PAGE_KEY, window.location.pathname + window.location.search);
  } catch {
    // Private mode or storage disabled: the return page falls back to email.
  }
}

export default function OnboardingHub({
  token,
  initialState,
  initialError,
}: {
  token: string;
  initialState: OnboardingState | null;
  initialError: string | null;
}) {
  const [state, setState] = useState<OnboardingState | null>(initialState);
  const [loadError, setLoadError] = useState<string | null>(initialError);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyTask, setBusyTask] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectElement, setConnectElement] = useState<HTMLElement | null>(null);
  /** A step the instructor picked from the list; otherwise the first open one. */
  const [chosenId, setChosenId] = useState<OnboardingTask["id"] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const connectContainer = useRef<HTMLDivElement | null>(null);
  const currentCard = useRef<HTMLElement | null>(null);
  const reviewPending = useRef(false);
  const latestLoad = useRef(0);

  useEffect(() => {
    if (connectOpen && connectElement && connectContainer.current) {
      connectContainer.current.replaceChildren(connectElement);
    }
  }, [connectOpen, connectElement]);

  /**
   * Move focus (and, only if it is off screen, the view) to the current-step
   * card. Used when the step changes under the instructor's hand, so keyboard
   * and screen-reader users land on the new step rather than on a button that
   * no longer exists.
   */
  const revealCurrentCard = useCallback(() => {
    requestAnimationFrame(() => {
      const card = currentCard.current;
      if (!card) return;
      card.focus({ preventScroll: true });
      if (card.getBoundingClientRect().top < 0) {
        card.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
        });
      }
    });
  }, []);

  useEffect(() => {
    if (connectOpen) revealCurrentCard();
  }, [connectOpen, revealCurrentCard]);

  /**
   * Polling, tab visibility and completed actions can start overlapping reads.
   * Only the newest response may update the page, so a slower pre-confirmation
   * read cannot replace a freshly confirmed live listing.
   */
  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) return;
      const requestId = ++latestLoad.current;
      try {
        const response = await fetch(
          `/api/instructor/onboarding?token=${encodeURIComponent(token)}`,
          { cache: "no-store", signal }
        );
        const body = await response.json();
        if (signal?.aborted || requestId !== latestLoad.current) return;
        if (!response.ok) throw new Error(body.error || "Could not load your setup steps.");
        setState(body as OnboardingState);
        setLoadError(null);
      } catch (cause) {
        if (signal?.aborted || requestId !== latestLoad.current ||
            (cause instanceof DOMException && cause.name === "AbortError")) {
          return;
        }
        setLoadError(cause instanceof Error ? cause.message : "Could not load your setup steps.");
      }
    },
    [token]
  );

  // Stripe confirms membership and payouts through webhooks, which land some
  // seconds after the instructor finishes. Without polling the page would sit
  // on stale text and they would assume it had not worked.
  useEffect(() => {
    if (!token || state?.complete) return;
    const id = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(id);
  }, [token, state?.complete, load]);

  // Refresh the moment they come back to the tab — returning from Stripe
  // Checkout is exactly when the list is most likely to be out of date.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const startMembership = useCallback(async () => {
    setBusyTask("membership");
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/instructor/billing-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not start membership setup.");
      const destination = body.checkout_url || body.app_url;
      if (!destination) throw new Error("Stripe did not return a secure checkout link.");
      rememberSetupPage();
      window.location.assign(destination);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not start membership setup.");
      setBusyTask(null);
    }
  }, [token]);

  const startPayouts = useCallback(async () => {
    setBusyTask("payouts");
    setActionError(null);
    setNotice(null);
    try {
      const newSession = async (): Promise<{ client_secret: string; publishable_key: string }> => {
        const response = await fetch("/api/instructor/connect-onboard", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not start Stripe Connect setup.");
        if (!body.client_secret || !body.publishable_key) {
          throw new Error("Stripe did not return an embedded setup session.");
        }
        return body;
      };
      const initialSession = await newSession();
      let firstSecret: string | null = initialSession.client_secret;

      const { loadConnectAndInitialize } = await import("@stripe/connect-js/pure");
      const stripeConnect = loadConnectAndInitialize({
        publishableKey: initialSession.publishable_key,
        fetchClientSecret: async () => {
          if (firstSecret) {
            const secret = firstSecret;
            firstSecret = null;
            return secret;
          }
          try {
            return (await newSession()).client_secret;
          } catch (cause) {
            setActionError(cause instanceof Error ? cause.message : "Could not refresh Stripe Connect setup.");
            throw cause;
          }
        },
      });
      const onboarding = stripeConnect.create("account-onboarding");
      onboarding.setFullTermsOfServiceUrl(`${window.location.origin}/terms`);
      onboarding.setRecipientTermsOfServiceUrl(`${window.location.origin}/terms`);
      onboarding.setPrivacyPolicyUrl(`${window.location.origin}/privacy`);
      // Leaving Stripe's flow covers both "finished" and "gave up part way",
      // so this re-reads the list rather than claiming either.
      onboarding.setOnExit(() => {
        setConnectOpen(false);
        setConnectElement(null);
        void load();
      });

      setConnectElement(onboarding);
      setConnectOpen(true);
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not start Stripe Connect setup."
      );
    } finally {
      setBusyTask(null);
    }
  }, [token, load]);

  const saveCoverage = useCallback(
    async (mode: "miles" | "minutes", value: number) => {
      if (!state) return;
      setBusyTask("coverage");
      setActionError(null);
      try {
        const response = await fetch("/api/instructor/coverage", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token,
            // Echoed from their application rather than chosen here: which
            // centres they teach for is not what this step is asking.
            centre_slugs: state.coverage.centres.map((c) => c.slug),
            coverage_mode: mode,
            coverage_value: value,
          }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not save your service area.");
        setChosenId(null);
        await load();
        setNotice("Service area saved.");
        revealCurrentCard();
      } catch (cause) {
        setActionError(
          cause instanceof Error ? cause.message : "Could not save your service area."
        );
      } finally {
        setBusyTask(null);
      }
    },
    [token, state, load, revealCurrentCard]
  );

  const confirmListing = useCallback(async () => {
    if (reviewPending.current) return;
    reviewPending.current = true;
    setBusyTask("review");
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/instructor/confirm-listing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await response.json();
      if (!response.ok || body.listed !== true) {
        throw new Error(body.error || "Could not confirm your listing. Please try again.");
      }
      await load();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not confirm your listing.");
    } finally {
      reviewPending.current = false;
      setBusyTask(null);
    }
  }, [token, load]);

  /** "Start" on a later step in the list brings it into the current-step card. */
  const chooseStep = useCallback(
    (task: OnboardingTask) => {
      setChosenId(task.id);
      setActionError(null);
      setNotice(null);
      revealCurrentCard();
    },
    [revealCurrentCard]
  );

  const closeConnect = useCallback(() => {
    setConnectOpen(false);
    setConnectElement(null);
    void load();
  }, [load]);

  if (loadError && !state) {
    const linkUnusable = /invalid|expired/i.test(loadError);
    return (
      <Shell title={linkUnusable ? "This setup link no longer works" : "We couldn't load your setup"} align="left">
        <p className="mt-4 leading-7 text-ink-secondary">{loadError}</p>
        {linkUnusable ? (
          <>
            <p className="mt-3 leading-7 text-ink-secondary">
              Email us and we&apos;ll send you a fresh setup link.
            </p>
            <a
              href="mailto:support@newdryve.com?subject=Instructor%20setup%20link"
              className="focus-ring mt-6 inline-flex h-11 items-center justify-center rounded-full bg-racing-green px-5 text-sm font-bold text-white"
            >
              Request a fresh link
            </a>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void load()}
            className="focus-ring mt-6 inline-flex h-11 items-center justify-center rounded-full bg-racing-green px-5 text-sm font-bold text-white"
          >
            Try again
          </button>
        )}
      </Shell>
    );
  }

  if (!state) {
    return (
      <Shell title="Your Newdryve setup" align="left">
        <p className="mt-4 text-sm leading-6 text-ink-secondary">Loading your steps…</p>
      </Shell>
    );
  }

  const firstName = state.display_name?.trim().split(/\s+/)[0] ?? null;
  const tasks = state.tasks;
  const open = tasks.filter((task) => task.state === "todo" && task.action !== null);
  const payoutsTask = tasks.find((task) => task.id === "payouts") ?? null;
  // While Stripe's form is mounted it stays the current step, even if a poll
  // lands mid-form and reports the account as under review.
  const current = connectOpen
    ? payoutsTask
    : open.find((task) => task.id === chosenId) ?? open[0] ?? null;
  const blocked = tasks.find((task) => task.state === "blocked") ?? null;
  const waiting = tasks.filter((task) => task.state === "in_review");
  const membershipDone = tasks.some((task) => task.id === "membership" && task.state === "done");
  const showPreview = membershipDone && state.review && current?.action !== "review_listing";
  // The review step pins its button to the bottom of a phone screen; leave
  // room so the bar never covers the end of the page.
  const reviewing = !state.complete && current?.action === "review_listing";

  return (
    <main className={`mx-auto w-full max-w-xl px-4 pt-4 sm:px-5 sm:pt-12 ${reviewing ? "pb-36 sm:pb-16" : "pb-16"}`}>
      <div className="flex items-center justify-between">
        <Wordmark />
        <a
          href="mailto:support@newdryve.com?subject=Instructor%20setup"
          className="focus-ring -mr-3 inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-ink underline-offset-2 hover:underline"
        >
          Need help?
        </a>
      </div>

      <header className="mt-5 sm:mt-8">
        <h1 className="font-display text-[30px] leading-tight text-ink sm:text-4xl">
          {state.complete
            ? firstName ? `You're live, ${firstName}.` : "You're live."
            : firstName ? `Nearly there, ${firstName}.` : "Nearly there."}
        </h1>
        <StepProgress tasks={tasks} />
      </header>

      {loadError ? (
        <p role="status" className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-ink-secondary">
          {loadError} Showing the last version we loaded.
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm font-semibold text-racing-green">
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {notice}
        </p>
      ) : null}

      <section
        ref={currentCard}
        tabIndex={-1}
        aria-labelledby="current-step-title"
        className={`mt-5 scroll-mt-4 rounded-2xl border bg-white p-5 shadow-[0_20px_50px_-30px_rgba(10,10,20,0.22)] outline-none sm:p-7 ${
          !state.complete && !current && blocked ? "border-rose-200" : "border-border"
        }`}
      >
        {state.complete ? (
          <LiveCard />
        ) : current ? (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[1px] text-deep-rose-ink">
              Step {tasks.indexOf(current) + 1} of {tasks.length}
            </p>
            <h2 id="current-step-title" className="font-display mt-1.5 text-2xl text-ink">
              {current.title}
            </h2>
            <p className="mt-2 text-[15px] leading-6 text-ink-secondary sm:text-sm">
              {current.action === "coverage"
                ? "You won't appear in learners' searches until this is set."
                : current.detail}
            </p>

            {current.action === "membership_checkout" ? (
              <MembershipAction
                membership={state.membership}
                busy={busyTask === "membership"}
                onStart={() => void startMembership()}
              />
            ) : null}

            {current.id === "payouts" ? (
              connectOpen ? (
                <>
                  <p className="mt-4 text-[13px] leading-5 text-ink-secondary">
                    Secure form provided by Stripe. Newdryve never sees your full bank details.
                  </p>
                  {/* Bleeds to the card's edges on a phone: Stripe's form
                      needs every pixel of width it can get at 320-390px. */}
                  <div ref={connectContainer} className="-mx-5 mt-4 sm:mx-0" />
                  <button
                    type="button"
                    onClick={closeConnect}
                    className="focus-ring mt-4 min-h-11 text-sm font-semibold text-racing-green underline"
                  >
                    Close and check status
                  </button>
                </>
              ) : current.action === "connect_onboarding" ? (
                <>
                  <button
                    type="button"
                    onClick={() => void startPayouts()}
                    disabled={busyTask === "payouts"}
                    className="focus-ring mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                  >
                    {busyTask === "payouts" ? "Opening Stripe…" : "Connect bank account"}
                  </button>
                  <p className="mt-3 text-[13px] leading-5 text-ink-secondary">
                    A secure Stripe form opens on this page. Newdryve never sees your full bank details.
                  </p>
                </>
              ) : null
            ) : null}

            {current.action === "coverage" ? (
              <CoverageStep
                key={state.coverage.centres.map((centre) => centre.slug).join(",")}
                coverage={state.coverage}
                busy={busyTask === "coverage"}
                onSave={saveCoverage}
              />
            ) : null}

            {current.action === "review_listing" && state.review ? (
              <ReviewStep
                review={state.review}
                busy={busyTask === "review"}
                error={actionError}
                onConfirm={() => void confirmListing()}
              />
            ) : null}
          </>
        ) : blocked ? (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[1px] text-rose-800">Needs our help</p>
            <h2 id="current-step-title" className="font-display mt-1.5 text-2xl text-ink">
              {blocked.title}
            </h2>
            <p className="mt-2 text-[15px] leading-6 text-ink-secondary sm:text-sm">{blocked.detail}</p>
            <a
              href="mailto:support@newdryve.com?subject=Instructor%20setup%20blocked"
              className="focus-ring mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white sm:w-auto"
            >
              Email support
            </a>
          </>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[1px] text-racing-green">Nothing to do right now</p>
            <h2 id="current-step-title" className="font-display mt-1.5 text-2xl text-ink">
              We&rsquo;re on it.
            </h2>
            <p className="mt-2 text-[15px] leading-6 text-ink-secondary sm:text-sm">
              {waiting.length
                ? "Nothing is needed from you while the checks marked \u201cWith us\u201d below finish. "
                : ""}
              This page updates by itself, so you can close it and come back.
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="focus-ring mt-4 min-h-11 text-sm font-semibold text-racing-green underline"
            >
              Check now
            </button>
          </>
        )}

        {actionError && !reviewing ? (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {actionError}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="all-steps-title" className="mt-7">
        <h2 id="all-steps-title" className="text-xs font-bold uppercase tracking-[1px] text-ink">
          All steps
        </h2>
        <div className="mt-2">
          <StepList tasks={tasks} focusedId={state.complete ? null : current?.id ?? null} onFocus={chooseStep} />
        </div>
      </section>

      {showPreview ? (
        <details className="group mt-6 rounded-2xl border border-border bg-white">
          <summary className="focus-ring flex min-h-12 cursor-pointer list-none items-center justify-between rounded-2xl px-4 text-[15px] font-semibold sm:px-5 sm:text-sm text-ink [&::-webkit-details-marker]:hidden">
            {state.listed ? "See your public listing" : "Preview what learners will see"}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="transition-transform group-open:rotate-180">
              <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <ListingSummary review={state.review} />
            <p className="mt-3 text-[13px] leading-5 text-ink-secondary">
              Need to correct anything? Email{" "}
              <a className="font-semibold underline" href="mailto:support@newdryve.com?subject=Instructor%20listing%20correction">
                support@newdryve.com
              </a>
              .
            </p>
          </div>
        </details>
      ) : null}
    </main>
  );
}

function MembershipAction({
  membership,
  busy,
  onStart,
}: {
  membership: OnboardingState["membership"];
  busy: boolean;
  onStart: () => void;
}) {
  const monthly =
    membership.monthly_amount_pence != null
      ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(
          membership.monthly_amount_pence / 100
        )
      : null;
  const terms = monthly
    ? membership.trial_months > 0
      ? `${membership.trial_months}-month free trial, then ${monthly} a month.`
      : `${monthly} a month.`
    : null;

  return (
    <>
      {terms ? (
        <p className="mt-4 rounded-xl bg-canvas px-4 py-3 text-sm font-semibold text-ink">{terms}</p>
      ) : null}
      <button
        type="button"
        onClick={onStart}
        disabled={busy}
        className="focus-ring mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Opening Stripe…" : "Continue to Stripe"}
      </button>
      <p className="mt-3 text-[13px] leading-5 text-ink-secondary">
        Stripe shows the exact first charge before you confirm, then sends you back to finish setup.
      </p>
    </>
  );
}

function LiveCard() {
  return (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[1px] text-racing-green">Setup complete</p>
      <h2 id="current-step-title" className="font-display mt-1.5 text-2xl text-ink">
        Learners can now find and book you.
      </h2>
      <p className="mt-2 text-[15px] leading-6 text-ink-secondary sm:text-sm">
        Sign in to the Newdryve app with the email and password you applied with to manage lessons,
        availability and payouts.
      </p>
      <a
        href={APP_URL}
        className="focus-ring mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white sm:w-auto"
      >
        Open Newdryve
      </a>
    </>
  );
}
