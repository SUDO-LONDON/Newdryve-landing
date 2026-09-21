/**
 * POST /api/instructor/billing-checkout
 *
 * Exchanges the one-time membership activation token from the approval email
 * for a Stripe Checkout subscription session.
 *
 * Response: 200 { checkout_url } — or { already_active: true, app_url } when
 *           the membership is already live and only payouts remain.
 *           | 400 invalid token | 404 used/expired link
 *           | 503 BACKEND_ORIGIN unset | 502 API unreachable
 */
import { postToken } from "@/lib/instructor/backend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return postToken(
    request,
    "/v1/instructors/billing/checkout",
    "Membership setup is temporarily unavailable.",
    "Could not start membership setup."
  );
}
