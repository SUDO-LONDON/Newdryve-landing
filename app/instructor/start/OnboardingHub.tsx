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
import type { StripeConnectInstance } from "@stripe/connect-js/pure";
import type { OnboardingState, OnboardingTask } from "@/lib/instructor/backend";
import { OnboardingFrame, Shell } from "@/components/instructor/Shell";
import { StepList, StepProgress } from "@/components/instructor/TaskList";
import { CoverageStep } from "@/components/instructor/CoverageStep";
import { ListingSummary, ReviewStep } from "@/components/instructor/ReviewStep";
import { rememberMembershipToken, SETUP_PAGE_KEY } from "@/lib/instructor/setup-page";

/**
 * The store listings, the same as apps/marketing/src/config/site.ts. Both
 * stores are live; app.newdryve.com is now a download page, not the web app.
 */
const IOS_APP_URL = "https://apps.apple.com/gb/app/newdryve/id6795593802";
const ANDROID_APP_URL = "https://play.google.com/store/apps/details?id=com.newdryve.app";

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
  /**
   * One Stripe Connect instance per page. Each new instance POSTs for a fresh
   * Account Session (rate-limited to 10 per 10 minutes), so re-creating it on
   * every "Connect bank account" click soon locked the instructor out.
   */
  const stripeConnectRef = useRef<StripeConnectInstance | null>(null);

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
        const response = await fetch("/api/instructor/onboarding", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
          cache: "no-store",
          signal,
        });
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
      // Checkout's cancel URL carries no token; the cancelled page reads this.
      if (body.checkout_url) rememberMembershipToken(token);
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
      let stripeConnect = stripeConnectRef.current;
      if (!stripeConnect) {
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
        stripeConnect = loadConnectAndInitialize({
          publishableKey: initialSession.publishable_key,
          // Stripe calls this again only when the session itself expires.
          fetchClientSecret: async () => {
            if (firstSecret) {
              const secret = firstSecret;
              firstSecret = null;
              return secret;
            }
            try {
              return (await newSession()).client_secret;
            } catch (cause) {
              // Start over with a fresh instance on the next click.
              stripeConnectRef.current = null;
              setActionError(cause instanceof Error ? cause.message : "Could not refresh Stripe Connect setup.");
              throw cause;
            }
          },
        });
        stripeConnectRef.current = stripeConnect;
      }
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
      <Shell title={linkUnusable ? "this setup link no longer works" : "we couldn't load your setup"} align="left">
        <p className="nd-body mt-4">{loadError}</p>
        {linkUnusable ? (
          <>
            <p className="nd-body mt-3">
              Email us and we&apos;ll send you a fresh setup link.
            </p>
            <a
              href="mailto:support@newdryve.com?subject=Instructor%20setup%20link"
              className="nd-btn nd-btn-lg mt-6 w-full sm:w-auto"
            >
              Request a fresh link
            </a>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void load()}
            className="nd-btn nd-btn-lg mt-6 w-full sm:w-auto"
          >
            Try again
          </button>
        )}
      </Shell>
    );
  }

  if (!state) {
    return (
      <Shell title="your newdryve setup" align="left">
        <p className="nd-body mt-4">Loading your steps…</p>
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
    <OnboardingFrame
      headerAside={
        <a href="mailto:support@newdryve.com?subject=Instructor%20setup" className="nd-nav-link -mr-1">
          Need help?
        </a>
      }
    >
      <main className={`flex flex-1 flex-col ${reviewing ? "pb-36 sm:pb-16" : "pb-16"}`}>
        <header className="nd-band pt-10 pb-12 sm:pt-14 sm:pb-16">
          <div className="nd-container-narrow">
            <h1 className="nd-h1">
              {state.complete
                ? firstName ? `you're live, ${firstName}.` : "you're live."
                : firstName ? `nearly there, ${firstName}.` : "nearly there."}
            </h1>
            <StepProgress tasks={tasks} />
          </div>
        </header>

        <div className="nd-container-narrow pt-8 sm:pt-12">
          {loadError ? (
            <p role="status" className="nd-note-box mb-5">
              {loadError} Showing the last version we loaded.
            </p>
          ) : null}
          {!state.complete && current && blocked ? (
            // A blocked step (e.g. an overdue membership payment) needs support,
            // not a button, so it would otherwise only show in the list below
            // while the card asks for something else.
            <div role="status" className="nd-info mb-5">
              <p className="font-semibold text-[var(--pink-ink)]">{blocked.title}</p>
              <p className="mt-1">{blocked.detail}</p>
            </div>
          ) : null}
          {notice ? (
            <p role="status" className="mb-5 flex items-center gap-2.5 text-[17px] font-semibold">
              <span aria-hidden="true" className="nd-marker nd-marker-done size-7">
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {notice}
            </p>
          ) : null}

          <section
            ref={currentCard}
            tabIndex={-1}
            aria-labelledby="current-step-title"
            className={`nd-card-lg nd-shadow scroll-mt-4 p-5 outline-none sm:p-8 ${
              !state.complete && !current && blocked ? "border-[var(--pink-ink)]" : ""
            }`}
          >
            {state.complete ? (
              <LiveCard />
            ) : current ? (
              <>
                <p className="flex items-center gap-3">
                  <span aria-hidden="true" className="nd-marker nd-marker-sm">
                    {tasks.indexOf(current) + 1}
                  </span>
                  <span className="nd-small-label">
                    Step {tasks.indexOf(current) + 1} of {tasks.length}
                  </span>
                </p>
                <h2 id="current-step-title" className="nd-h3 mt-4">
                  {current.title}
                </h2>
                <p className="nd-body mt-2">
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
                      <p className="nd-help mt-4">
                        Secure form provided by Stripe. Newdryve never sees your full bank details.
                      </p>
                      {/* Bleeds to the card's edges on a phone: Stripe's form
                          needs every pixel of width it can get at 320-390px. */}
                      <div ref={connectContainer} className="-mx-5 mt-4 sm:mx-0" />
                      <button
                        type="button"
                        onClick={closeConnect}
                        className="nd-text-btn mt-4"
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
                        className="nd-btn nd-btn-lg mt-6 w-full sm:w-auto"
                      >
                        {busyTask === "payouts" ? "Opening Stripe…" : "Connect bank account"}
                      </button>
                      <p className="nd-help mt-3">
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
                <p>
                  <span className="nd-tag nd-tag-pink">Needs our help</span>
                </p>
                <h2 id="current-step-title" className="nd-h3 mt-4">
                  {blocked.title}
                </h2>
                <p className="nd-body mt-2">{blocked.detail}</p>
                <a
                  href="mailto:support@newdryve.com?subject=Instructor%20setup%20blocked"
                  className="nd-btn nd-btn-lg mt-6 w-full sm:w-auto"
                >
                  Email support
                </a>
              </>
            ) : (
              <>
                <p className="nd-small-label">Nothing to do right now</p>
                <h2 id="current-step-title" className="nd-h3 mt-2">
                  we&rsquo;re on it.
                </h2>
                <p className="nd-body mt-2">
                  {waiting.length
                    ? "Nothing is needed from you while the checks marked “With us” below finish. "
                    : ""}
                  This page updates by itself, so you can close it and come back.
                </p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="nd-text-btn mt-4"
                >
                  Check now
                </button>
              </>
            )}

            {actionError && !reviewing ? (
              <p role="alert" className="nd-alert mt-5">
                {actionError}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="all-steps-title" className="mt-10">
            <h2 id="all-steps-title" className="nd-h4">
              all steps
            </h2>
            <div className="mt-4">
              <StepList tasks={tasks} focusedId={state.complete ? null : current?.id ?? null} onFocus={chooseStep} />
            </div>
          </section>

          {showPreview ? (
            <details className="group nd-card mt-6">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-[22px] px-4 text-[17px] font-semibold sm:px-5 [&::-webkit-details-marker]:hidden">
                {state.listed ? "See your public listing" : "Preview what learners will see"}
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-180">
                  <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <ListingSummary review={state.review} />
                <p className="nd-help mt-3">
                  Need to correct anything? Email{" "}
                  <a className="nd-link" href="mailto:support@newdryve.com?subject=Instructor%20listing%20correction">
                    support@newdryve.com
                  </a>
                  .
                </p>
              </div>
            </details>
          ) : null}
        </div>
      </main>
    </OnboardingFrame>
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
        <p className="nd-info mt-5 font-semibold">{terms}</p>
      ) : null}
      <button
        type="button"
        onClick={onStart}
        disabled={busy}
        className="nd-btn nd-btn-lg mt-6 w-full sm:w-auto"
      >
        {busy ? "Opening Stripe…" : "Continue to Stripe"}
      </button>
      <p className="nd-help mt-3">
        Stripe shows the exact first charge before you confirm, then sends you back to finish setup.
      </p>
    </>
  );
}

function LiveCard() {
  return (
    <>
      <p className="nd-small-label">Setup complete</p>
      <h2 id="current-step-title" className="nd-h3 mt-2">
        learners can now find and book you.
      </h2>
      <p className="nd-body mt-2">
        Sign in to the Newdryve app with the email and password you applied with to manage lessons,
        availability and payouts.
      </p>
      <p className="mt-5 text-[17px] font-semibold">Newdryve is on the App Store and Google Play.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <a href={IOS_APP_URL} className="inline-block rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element -- static badge artwork */}
          <img src="/app-store-badge.svg" alt="Download on the App Store" width={150} height={50} className="h-[50px] w-auto" />
        </a>
        <a href={ANDROID_APP_URL} className="-mx-1.5 -my-2.5 inline-block rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element -- static badge artwork */}
          <img src="/google-play-badge.png" alt="Get it on Google Play" width={181} height={70} className="h-[70px] w-auto" />
        </a>
      </div>
    </>
  );
}
