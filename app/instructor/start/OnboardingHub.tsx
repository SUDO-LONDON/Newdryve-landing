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
  const connectContainer = useRef<HTMLDivElement | null>(null);

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

      const { loadConnectAndInitialize } = await import("@stripe/connect-js/pure");
      const stripeConnect = loadConnectAndInitialize({
        publishableKey: body.publishable_key,
        fetchClientSecret: async () => body.client_secret as string,
      });
      const onboarding = stripeConnect.create("account-onboarding");
      onboarding.setFullTermsOfServiceUrl(`${window.location.origin}/terms`);
      onboarding.setRecipientTermsOfServiceUrl(`${window.location.origin}/terms`);
      onboarding.setPrivacyPolicyUrl(`${window.location.origin}/privacy`);
      // Leaving Stripe's flow covers both "finished" and "gave up part way",
      // so this re-reads the list rather than claiming either.
      onboarding.setOnExit(() => {
        setConnectOpen(false);
        void load();
      });

      setConnectOpen(true);
      // The container only exists once connectOpen has rendered it.
      queueMicrotask(() => {
        const node = connectContainer.current;
        if (!node) return;
        node.replaceChildren();
        node.appendChild(onboarding);
      });
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not start Stripe Connect setup."
      );
    } finally {
      setBusyTask(null);
    }
  }, [token, load]);

  const onAction = useCallback(
    (task: OnboardingTask) => {
      if (task.action === "membership_checkout") void startMembership();
      if (task.action === "connect_onboarding") void startPayouts();
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
            : "Work through these in any order. We'll keep this page up to date as each step completes — you can leave it open."}
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

      {connectOpen ? (
        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-[0_20px_50px_-30px_rgba(10,10,20,0.22)] sm:p-8">
          <h2 className="font-display text-2xl text-ink">Connect your bank account</h2>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            This secure form is provided by Stripe inside Newdryve. Newdryve never sees your full
            bank details.
          </p>
          <div ref={connectContainer} className="mt-6" />
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
