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
        <Shell title="activate your membership" align="left">
          <p className="nd-body mt-4">Loading…</p>
        </Shell>
      }
    >
      <ActivateMembership />
    </Suspense>
  );
}
