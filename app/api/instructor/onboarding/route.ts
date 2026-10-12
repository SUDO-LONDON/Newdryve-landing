/**
 * POST /api/instructor/onboarding  { token }
 *
 * The onboarding hub's only data source. Proxied so the browser never learns
 * the API origin and so the per-IP rate limit is keyed on the instructor.
 *
 * A POST although it only reads: setup tokens do not expire, so the token is
 * kept out of query strings, where proxies and access logs would record it on
 * every 15-second poll.
 */
import { fetchOnboarding, json, readToken } from "@/lib/instructor/backend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = await readToken(request);
  if ("error" in parsed) return json({ error: parsed.error }, parsed.status);
  return fetchOnboarding(request, parsed.token);
}
