"use client";

/**
 * Stripe's `refresh_url`: the hosted Account Link it sends the mobile app to
 * is single-use and expires. The API puts a payout-setup refresh token (valid
 * 24 hours) on that URL, which /instructor/connect hands to the setup hub like
 * the emailed one. Older links without it can only ask for a resend.
 */

import { useSearchParams } from "next/navigation";
import { Body, ErrorNote, PrimaryLink, Shell } from "@/components/instructor/Shell";

export default function RefreshLink() {
  const token = useSearchParams().get("token") ?? "";

  return (
    <Shell eyebrow="Link expired" eyebrowTone="rose" title="Let's create a fresh link">
      <Body>
        Stripe onboarding links are single-use. Continue here and we&rsquo;ll reopen the secure
        embedded setup form.
      </Body>
      <PrimaryLink
        href={token ? `/instructor/connect?token=${encodeURIComponent(token)}` : "/instructor/setup"}
        disabled={!token}
      >
        Reopen setup
      </PrimaryLink>
      {!token ? (
        <ErrorNote>
          This refresh link is incomplete. Please ask support@newdryve.com to resend your Stripe
          Connect setup link.
        </ErrorNote>
      ) : null}
    </Shell>
  );
}
