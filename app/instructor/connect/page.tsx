import type { Metadata } from "next";
import { Suspense } from "react";
import { Shell } from "@/components/instructor/Shell";
import ConnectOnboarding from "./ConnectOnboarding";

export const metadata: Metadata = {
  title: "Set up Stripe Connect",
  description: "Connect your payout account so Newdryve can send lesson payments to you.",
  robots: { index: false, follow: false },
};

export default function InstructorConnectPage() {
  return (
    <Suspense
      fallback={
        <Shell eyebrow="Instructor payouts" title="Set up Stripe Connect">
          <p className="mt-4 text-sm leading-6 text-ink-secondary">Loading…</p>
        </Shell>
      }
    >
      <ConnectOnboarding />
    </Suspense>
  );
}
