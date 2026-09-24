/** Confirm the instructor's public details and switch their listing on. */
import { postToken } from "@/lib/instructor/backend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return postToken(
    request,
    "/v1/instructors/onboarding/confirm-listing",
    "Listing confirmation is temporarily unavailable.",
    "Could not confirm your listing. Please try again."
  );
}
