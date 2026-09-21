"use client";

/**
 * Stripe Connect payout onboarding, embedded.
 *
 * The instructor never leaves Newdryve: Stripe's own onboarding form is
 * mounted inside this card as a Connect embedded component. The one-time token
 * in the URL is the only credential — a half-onboarded instructor has no app
 * session yet, because the API keeps them signed out until payouts are ready.
 */

import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Body, ErrorNote, Note, PrimaryButton, Shell } from "@/components/instructor/Shell";

type Phase = "idle" | "loading" | "mounted" | "submitted";

export default function ConnectOnboarding() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [phase, setPhase] = useState<Phase>("idle");
  const [failure, setFailure] = useState<string | null>(null);
  const container = useRef<HTMLDivElement | null>(null);

  // Derived, not stored: a missing token is a property of the URL, and writing
  // it into state during an effect makes the first paint show a working button
  // that then turns into an error.
  const error = token
    ? failure
    : "This payout setup link is incomplete. Please use the link from your Newdryve email.";

  const start = useCallback(async () => {
    if (!token) return;
    setPhase("loading");
    setFailure(null);
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

      // Loaded on demand rather than at module scope: this pulls Stripe's
      // script into the page, and an instructor who never presses the button
      // should not pay for it.
      const { loadConnectAndInitialize } = await import("@stripe/connect-js/pure");
      const stripeConnect = loadConnectAndInitialize({
        publishableKey: body.publishable_key,
        fetchClientSecret: async () => body.client_secret as string,
      });

      const onboarding = stripeConnect.create("account-onboarding");
      onboarding.setFullTermsOfServiceUrl(`${window.location.origin}/terms`);
      onboarding.setRecipientTermsOfServiceUrl(`${window.location.origin}/terms`);
      onboarding.setPrivacyPolicyUrl(`${window.location.origin}/privacy`);
      // Stripe fires this when the instructor leaves its flow — which covers
      // both "finished" and "gave up part way". We cannot tell the two apart
      // here, so the copy claims submission, never approval; `account.updated`
      // is what actually moves them to onboarded.
      onboarding.setOnExit(() => setPhase("submitted"));

      const node = container.current;
      if (!node) throw new Error("Could not load the setup container.");
      node.replaceChildren();
      node.appendChild(onboarding);
      setPhase("mounted");
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : "Could not start Stripe Connect setup.");
      setPhase("idle");
    }
  }, [token]);

  return (
    <Shell eyebrow="Instructor payouts" title="Set up Stripe Connect">
      <Body>
        Connect your bank details securely with Stripe so card lesson payments can be paid
        directly to you. Newdryve never sees your full bank details.
      </Body>

      {phase !== "mounted" ? (
        <PrimaryButton onClick={start} disabled={!token || phase === "loading"}>
          {phase === "loading"
            ? "Loading secure form…"
            : error
              ? "Try again"
              : "Start secure setup"}
        </PrimaryButton>
      ) : null}

      <ErrorNote>{error}</ErrorNote>

      {phase === "loading" ? (
        <div className="mt-5 rounded-xl bg-canvas px-4 py-3 text-sm text-ink-secondary">
          Loading Stripe&rsquo;s secure setup form…
        </div>
      ) : null}

      {phase === "submitted" ? (
        <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Thanks — Stripe received your payout details. We&rsquo;ll update your Newdryve payout
          status after Stripe confirms the account.
        </div>
      ) : null}

      <div ref={container} className={phase === "idle" ? "hidden" : "mt-7 text-left"} />

      <Note>
        This secure form is provided by Stripe inside Newdryve. If the link has expired, ask
        Newdryve support to resend your payout setup link.
      </Note>
    </Shell>
  );
}
