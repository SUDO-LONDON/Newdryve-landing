"use client";

/**
 * Instructor membership activation.
 *
 * Four states, chosen from the URL because that is all this page ever knows:
 * the approval email arrives with `?token=`, and Stripe Checkout returns with
 * `?status=success` or `?status=cancelled` (the token for "Try again" is kept
 * in session storage, since the API no longer gives it to Stripe). The account is only
 * unlocked by Stripe's webhook, so nothing here claims it on Stripe's behalf.
 */

import { useCallback, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { ErrorNote, PrimaryButton, PrimaryLink, Shell } from "@/components/instructor/Shell";
import {
  isSetupPagePath,
  readMembershipToken,
  rememberMembershipToken,
  SETUP_PAGE_KEY,
} from "@/lib/instructor/setup-page";

/** Session storage never changes under this page, so there is nothing to watch. */
const noSubscription = () => () => {};

function readSetupPage(): string | null {
  try {
    const stored = sessionStorage.getItem(SETUP_PAGE_KEY);
    return isSetupPagePath(stored) ? stored : null;
  } catch {
    return null; // Storage unavailable: the email route still works.
  }
}

export default function ActivateMembership() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const token = searchParams.get("token") ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state =
    status === "success" ? "success" : status === "cancelled" ? "cancelled" : token ? "ready" : "invalid";

  // Set when membership was started from the setup page in this tab. Null on
  // the server render, where session storage does not exist.
  const storedSetupPage = useSyncExternalStore(noSubscription, readSetupPage, () => null);
  const setupPage = state === "success" || state === "cancelled" ? storedSetupPage : null;
  // Back from a cancelled Checkout the URL has no token; the one that opened
  // Checkout in this tab was saved before leaving.
  const storedToken = useSyncExternalStore(noSubscription, readMembershipToken, () => null);
  const checkoutToken = token || (state === "cancelled" ? storedToken ?? "" : "");

  const activate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/instructor/billing-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: checkoutToken }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not start membership setup.");
      if (body.checkout_url) rememberMembershipToken(checkoutToken);
      // `app_url` comes back when membership is already live and only payouts
      // are left — going to Checkout again would charge for nothing.
      const destination = body.checkout_url || body.app_url;
      if (!destination) throw new Error("Stripe did not return a secure checkout link.");
      window.location.assign(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start membership setup.");
      setBusy(false);
    }
  }, [checkoutToken]);

  if (state === "success") {
    if (setupPage) {
      return (
        <Shell eyebrow="Membership submitted" title="back to your setup." align="left">
          <p className="nd-body mt-4">
            Stripe is confirming your membership. Your setup page updates on its own once it
            does.
          </p>
          <PrimaryLink href={setupPage}>Continue setup</PrimaryLink>
        </Shell>
      );
    }
    return (
      <Shell eyebrow="Step 1 of 4 done" title="check your inbox for the next step." align="left">
        <p className="nd-body mt-4">
          Stripe is confirming your membership. As soon as it does, we&rsquo;ll email you a link to your
          setup page to connect your bank account, set your service area and review your listing.
        </p>
        <p className="nd-help mt-3">If it doesn&rsquo;t arrive, check spam or email <a href="mailto:support@newdryve.com" className="nd-link">support@newdryve.com</a>.</p>
      </Shell>
    );
  }

  if (state === "cancelled") {
    return (
      <Shell eyebrow="Setup not completed" eyebrowTone="rose" title="no payment was taken." align="left">
        <p className="nd-body mt-4">
          You can try again now or reopen your approval email later.
        </p>
        {checkoutToken ? <PrimaryButton onClick={activate} disabled={busy}>{busy ? "Opening Stripe…" : "Try again"}</PrimaryButton> : null}
        {setupPage ? <PrimaryLink href={setupPage} variant="secondary">Back to your setup page</PrimaryLink> : null}
        <ErrorNote>{error}</ErrorNote>
      </Shell>
    );
  }

  if (state === "invalid") {
    return (
      <Shell title="this link is incomplete." align="left">
        <p className="nd-body mt-4">
          Please use the membership button in your approval email, or contact{" "}
          <a className="nd-link" href="mailto:support@newdryve.com">
            support@newdryve.com
          </a>
          .
        </p>
      </Shell>
    );
  }

  return (
    <Shell eyebrow="Application approved" title="welcome to newdryve." align="left">
      <p className="nd-body mt-4">
        Start by setting up your membership with Stripe. If you were given a free trial, you
        won&rsquo;t be charged until it ends.
      </p>
      <PrimaryButton onClick={activate} disabled={busy}>
        {busy ? "Opening Stripe…" : error ? "Try again" : "Continue to Stripe"}
      </PrimaryButton>
      <ErrorNote>{error}</ErrorNote>
      <p className="nd-help mt-3">
        Stripe shows the exact first charge before you confirm. Newdryve never sees your full card
        details.
      </p>
      <NextSteps />
    </Shell>
  );
}

/**
 * The whole road from here to going live, so membership is not mistaken for
 * the final step — it is the first of four, and the rest happen on the setup
 * page we email once Stripe confirms.
 */
function NextSteps() {
  const steps = [
    "Set up your membership",
    "Connect your bank account",
    "Set your service area",
    "Review your listing and go live",
  ];
  return (
    <div className="nd-divider mt-8 pt-6">
      <p className="nd-small-label">Your setup</p>
      <ol className="mt-4 flex flex-col gap-3">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-3 text-[17px]">
            <span
              aria-hidden="true"
              className={`nd-marker nd-marker-sm ${index === 0 ? "" : "nd-marker-quiet"}`}
            >
              {index + 1}
            </span>
            <span className={index === 0 ? "font-semibold" : "text-[var(--forest-soft)]"}>
              {step}
              {index === 0 ? <span className="sr-only"> (now)</span> : null}
            </span>
          </li>
        ))}
      </ol>
      <p className="nd-help mt-5">
        Once Stripe confirms your membership, we&rsquo;ll email you a link to finish steps 2 to 4.
      </p>
    </div>
  );
}
