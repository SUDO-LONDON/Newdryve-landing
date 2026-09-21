/**
 * POST /api/instructor/connect-onboard
 *
 * Exchanges the one-time payout setup token from the instructor's email for a
 * Stripe Connect embedded account session, so payout onboarding happens inside
 * Newdryve rather than on a hosted Stripe page.
 *
 * Response: 200 { client_secret, publishable_key, expires_at, stripe_account_id }
 *           | 400 invalid token | 404 expired link | 409 membership not ready
 *           | 503 BACKEND_ORIGIN unset | 502 API unreachable
 */
import { postToken } from "@/lib/instructor/backend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return postToken(
    request,
    "/v1/instructors/connect/onboard-online",
    "Stripe Connect setup is temporarily unavailable.",
    "Could not start Stripe Connect setup."
  );
}
