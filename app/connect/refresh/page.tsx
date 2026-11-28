import type { Metadata } from "next";
import { Suspense } from "react";
import { Shell } from "@/components/instructor/Shell";
import RefreshLink from "./RefreshLink";

export const metadata: Metadata = {
  title: "Restart Stripe payout setup",
  description: "Return to Newdryve to request a fresh Stripe onboarding link.",
  robots: { index: false, follow: false },
};

export default function ConnectRefreshPage() {
  return (
    <Suspense
      fallback={
        <Shell eyebrow="Link expired" eyebrowTone="rose" title="let's create a fresh link">
          <p className="nd-body mt-4">Loading…</p>
        </Shell>
      }
    >
      <RefreshLink />
    </Suspense>
  );
}
