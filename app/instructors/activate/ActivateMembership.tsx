"use client";

/**
 * Instructor membership activation.
 *
 * Four states, chosen from the URL because that is all this page ever knows:
 * the approval email arrives with `?token=`, and Stripe Checkout returns with
 * `?status=success&connect_token=` or `?status=cancelled`. The account is only
 * unlocked by Stripe's webhook, so nothing here claims it on Stripe's behalf.
 */

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ErrorNote, PrimaryButton, Shell } from "@/components/instructor/Shell";

export default function ActivateMembership() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const token = searchParams.get("token") ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state =
    status === "success" ? "success" : status === "cancelled" ? "cancelled" : token ? "ready" : "invalid";

  const activate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/instructor/billing-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not start membership setup.");
      // `app_url` comes back when membership is already live and only payouts
      // are left — going to Checkout again would charge for nothing.
      const destination = body.checkout_url || body.app_url;
      if (!destination) throw new Error("Stripe did not return a secure checkout link.");
      window.location.assign(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start membership setup.");
      setBusy(false);
    }
  }, [token]);

  if (state === "success") {
    return (
      <Shell eyebrow="Membership setup submitted" title="Check your inbox for the next step." align="left">
        <p className="mt-4 leading-7 text-ink-secondary">
          Stripe is confirming your membership. As soon as it does, we&rsquo;ll email you a link to finish
          setup on Newdryve: connect payouts, set your service area and review your listing.
        </p>
        <p className="mt-3 text-sm leading-6 text-ink-muted">If it doesn&rsquo;t arrive, check spam or email <a href="mailto:support@newdryve.com" className="font-semibold underline">support@newdryve.com</a>.</p>
      </Shell>
    );
  }

  if (state === "cancelled") {
    return (
      <Shell eyebrow="Setup not completed" eyebrowTone="rose" title="No payment was taken." align="left">
        <p className="mt-4 leading-7 text-ink-secondary">
          You can try again now or reopen your approval email later.
        </p>
        {token ? <PrimaryButton onClick={activate} disabled={busy}>{busy ? "Opening Stripe…" : "Try again"}</PrimaryButton> : null}
        <ErrorNote>{error}</ErrorNote>
      </Shell>
    );
  }

  if (state === "invalid") {
    return (
      <Shell title="This link is incomplete." align="left">
        <p className="mt-4 leading-7 text-ink-secondary">
          Please use the membership button in your approval email, or contact{" "}
          <a className="font-semibold underline" href="mailto:support@newdryve.com">
            support@newdryve.com
          </a>
          .
        </p>
      </Shell>
    );
  }

  return (
    <Shell eyebrow="Application approved" title="One last step." align="left">
      <p className="mt-4 leading-7 text-ink-secondary">
        Continue to Stripe to securely add your payment method. If you were granted a trial, you
        won&rsquo;t be charged until that trial ends.
      </p>
      <p className="mt-3 text-sm leading-6 text-ink-muted">
        Stripe shows the exact first-charge date before you confirm. Your account unlocks only
        after Stripe confirms setup. Newdryve never receives your full card details.
      </p>
      <PrimaryButton onClick={activate} disabled={busy}>
        {busy ? "Opening Stripe…" : error ? "Try again" : "Continue securely with Stripe"}
      </PrimaryButton>
      <ErrorNote>{error}</ErrorNote>
    </Shell>
  );
}
