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
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { OnboardingState, OnboardingTask } from "@/lib/instructor/backend";
import { Shell, Wordmark } from "@/components/instructor/Shell";
import { Progress, TaskRow } from "@/components/instructor/TaskList";
import { CoverageStep } from "@/components/instructor/CoverageStep";
import { ReviewStep } from "@/components/instructor/ReviewStep";

/** Long enough not to hammer the API, short enough to catch a Stripe webhook. */
const POLL_MS = 15_000;

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
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [connectElement, setConnectElement] = useState<HTMLElement | null>(null);
  const connectContainer = useRef<HTMLDivElement | null>(null);
  const reviewContainer = useRef<HTMLDivElement | null>(null);
  const reviewPending = useRef(false);

  useEffect(() => {
    if (connectOpen && connectElement && connectContainer.current) {
      connectContainer.current.replaceChildren(connectElement);
    }
  }, [connectOpen, connectElement]);

  /**
   * `signal` lets an in-flight read be abandoned when the component unmounts
   * or a newer read starts. Without it a slow response can land after a fresh
   * one and walk the list backwards — which on this page means telling someone
   * a step they just finished is still outstanding.
   */
  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) return;
      try {
        const response = await fetch(
          `/api/instructor/onboarding?token=${encodeURIComponent(token)}`,
          { cache: "no-store", signal }
        );
        const body = await response.json();
        if (signal?.aborted) return;
        if (!response.ok) throw new Error(body.error || "Could not load your setup steps.");
        setState(body as OnboardingState);
        setLoadError(null);
      } catch (cause) {
        if (signal?.aborted || (cause instanceof DOMException && cause.name === "AbortError")) {
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
      window.location.assign(destination);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not start membership setup.");
      setBusyTask(null);
    }
  }, [token]);

  const startPayouts = useCallback(async () => {
    setBusyTask("payouts");
    setActionError(null);
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
        setCoverageOpen(false);
        await load();
      } catch (cause) {
        setActionError(
          cause instanceof Error ? cause.message : "Could not save your service area."
        );
      } finally {
        setBusyTask(null);
      }
    },
    [token, state, load]
  );

  const confirmListing = useCallback(async () => {
    if (reviewPending.current) return;
    reviewPending.current = true;
    setBusyTask("review");
    setReviewError(null);
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
      setReviewError(cause instanceof Error ? cause.message : "Could not confirm your listing.");
    } finally {
      reviewPending.current = false;
      setBusyTask(null);
    }
  }, [token, load]);

  const onAction = useCallback(
    (task: OnboardingTask) => {
      if (task.action === "membership_checkout") void startMembership();
      if (task.action === "connect_onboarding") void startPayouts();
      if (task.action === "coverage") setCoverageOpen(true);
      if (task.action === "review_listing") {
        reviewContainer.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [startMembership, startPayouts]
  );

  if (loadError && !state) {
    return (
      <Shell title="We couldn't load your setup" align="left">
        <p className="mt-4 leading-7 text-ink-secondary">{loadError}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="focus-ring mt-6 inline-flex h-11 items-center justify-center rounded-full bg-racing-green px-5 text-sm font-bold text-white"
        >
          Try again
        </button>
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
  const membershipDone = state.tasks.some((task) => task.id === "membership" && task.state === "done");
  const reviewTask = state.tasks.find((task) => task.id === "review");
  const reviewReady = reviewTask?.state === "todo" && reviewTask.action === "review_listing";

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
      <Wordmark />

      <header className="mt-8">
        <p className="text-[11px] font-bold uppercase tracking-[1px] text-racing-green">
          {state.complete ? "You're all set" : "Getting you set up"}
        </p>
        <h1 className="font-display mt-3 text-4xl text-ink">
          {state.complete
            ? firstName
              ? `You're live, ${firstName}.`
              : "You're live."
            : firstName
              ? `Nearly there, ${firstName}.`
              : "Nearly there."}
        </h1>
        <p className="mt-4 leading-7 text-ink-secondary">
          {state.complete
            ? "Everything is done and learners can find you. Manage your lessons from the Newdryve app."
            : "Complete each available step here. We'll update this page as Stripe confirms your membership and payout details."}
        </p>
        <Progress tasks={state.tasks} />
      </header>

      {actionError ? (
        <p role="alert" className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {actionError}
        </p>
      ) : null}
      {loadError ? (
        <p role="status" className="mt-6 rounded-xl bg-canvas px-4 py-3 text-sm text-ink-secondary">
          {loadError} Showing the last version we loaded.
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-[0_20px_50px_-30px_rgba(10,10,20,0.22)] sm:p-8">
        <ul className="-my-1">
          {state.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              busy={busyTask === task.id}
              onAction={onAction}
            />
          ))}
        </ul>
      </section>

      {coverageOpen ? (
        <CoverageStep
          coverage={state.coverage}
          busy={busyTask === "coverage"}
          error={actionError}
          onSave={saveCoverage}
          onCancel={() => setCoverageOpen(false)}
        />
      ) : null}

      {membershipDone && state.review ? (
        <div ref={reviewContainer}>
          <ReviewStep
            review={state.review}
            busy={busyTask === "review"}
            ready={reviewReady}
            listed={state.listed}
            error={reviewError}
            onConfirm={() => void confirmListing()}
            onRefresh={() => void load()}
          />
        </div>
      ) : null}

      {connectOpen ? (
        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-[0_20px_50px_-30px_rgba(10,10,20,0.22)] sm:p-8">
          <h2 className="font-display text-2xl text-ink">Connect your bank account</h2>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            This secure form is provided by Stripe inside Newdryve. Newdryve never sees your full
            bank details.
          </p>
          <div ref={connectContainer} className="mt-6" />
          <button
            type="button"
            onClick={() => { setConnectOpen(false); setConnectElement(null); void load(); }}
            className="focus-ring mt-5 min-h-11 text-sm font-semibold text-racing-green underline"
          >
            Close setup and check status
          </button>
        </section>
      ) : null}

      <p className="mt-8 text-xs leading-5 text-ink-muted">
        Stuck on something? Email{" "}
        <a className="font-semibold underline" href="mailto:support@newdryve.com">
          support@newdryve.com
        </a>
        .
      </p>
    </main>
  );
}
