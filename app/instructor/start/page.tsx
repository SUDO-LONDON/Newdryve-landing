import type { Metadata } from "next";
import { headers } from "next/headers";
import { Shell } from "@/components/instructor/Shell";
import { loadOnboarding } from "@/lib/instructor/backend";
import OnboardingHub from "./OnboardingHub";

export const metadata: Metadata = {
  title: "Your Newdryve setup",
  description: "Everything left to do before you can take bookings on Newdryve.",
  robots: { index: false, follow: false },
};

/** Always fresh: the whole point of the page is that it changes under them. */
export const dynamic = "force-dynamic";

/**
 * The task list is read on the SERVER for the first paint.
 *
 * Fetching it in the browser instead would show every instructor a spinner on
 * a page whose entire job is to tell them where they stand, and would leave
 * the one number they came for — how much is left — missing until hydration.
 * The client takes over from there to poll and to run the Stripe steps.
 */
export default async function InstructorStartPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params.token;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  if (!token) {
    return (
      <Shell title="This link is incomplete." align="left">
        <p className="mt-4 leading-7 text-ink-secondary">
          Open the setup link from your Newdryve email, or contact{" "}
          <a className="font-semibold underline" href="mailto:support@newdryve.com">
            support@newdryve.com
          </a>{" "}
          and we will send you a fresh one.
        </p>
      </Shell>
    );
  }

  // Forwarded so the API's per-IP rate limit is keyed on the instructor rather
  // than on this service's single egress address.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const result = await loadOnboarding(token, ip);

  return (
    <OnboardingHub
      token={token}
      initialState={"state" in result ? result.state : null}
      initialError={"error" in result ? result.error : null}
    />
  );
}
