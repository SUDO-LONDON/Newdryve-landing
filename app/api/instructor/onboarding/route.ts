/**
 * GET /api/instructor/onboarding?token=…
 *
 * The onboarding hub's only data source. Proxied so the browser never learns
 * the API origin and so the per-IP rate limit is keyed on the instructor.
 */
import { fetchOnboarding, json } from "@/lib/instructor/backend";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) return json({ error: "This link is incomplete." }, 400);
  return fetchOnboarding(request, token);
}
