import type { Metadata } from "next";
import { Suspense } from "react";
import { Shell } from "@/components/instructor/Shell";
import ActivateMembership from "./ActivateMembership";

export const metadata: Metadata = {
  title: "Activate your membership",
  description: "Complete your Newdryve instructor membership setup securely through Stripe.",
  robots: { index: false, follow: false },
};

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <Shell title="Activate your membership" align="left">
          <p className="mt-4 text-sm leading-6 text-ink-secondary">Loading…</p>
        </Shell>
      }
    >
      <ActivateMembership />
    </Suspense>
  );
}
