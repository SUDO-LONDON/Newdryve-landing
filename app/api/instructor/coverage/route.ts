/**
 * PUT /api/instructor/coverage
 *
 * Saves the instructor's first service area during web onboarding. The API
 * accepts this once — later changes are made from the signed-in app.
 */
import { postCoverage, json } from "@/lib/instructor/backend";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  return postCoverage(request, body);
}
