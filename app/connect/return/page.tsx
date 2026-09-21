import type { Metadata } from "next";
import { Body, Note, PrimaryLink, Shell } from "@/components/instructor/Shell";

export const metadata: Metadata = {
  title: "Stripe payout setup",
  description: "Return to Newdryve after Stripe payout onboarding.",
  robots: { index: false, follow: false },
};

/**
 * Stripe's `return_url` for the hosted Account Link the mobile app still uses.
 * Returning here means Stripe collected details, not that it accepted them.
 */
export default function ConnectReturnPage() {
  return (
    <Shell eyebrow="Secure payouts" title="Setup submitted">
      <Body>
        Thanks — Stripe has received your payout setup details. We&rsquo;ll update your Newdryve
        payout status after Stripe confirms your account.
      </Body>
      <PrimaryLink href="/">Back to Newdryve</PrimaryLink>
      <Note>
        Stripe may still be reviewing your details. You can continue using the app while
        verification completes.
      </Note>
    </Shell>
  );
}
