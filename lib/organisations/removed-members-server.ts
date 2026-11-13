import "server-only";

import { NEWDRYVE_API_ORIGIN } from "@/lib/organisations/env";
import { readRemovedMembers, type RemovedMember } from "@/lib/organisations/removed-members";
import { withSchool } from "@/lib/organisations/scope";

/**
 * The school's banned instructors for the overview, or null when they could
 * not be read (an API from before #644 answers 404). The overview then leaves
 * the section out rather than failing the whole page.
 */
export async function loadRemovedMembers(accessToken: string, school: string | null): Promise<RemovedMember[] | null> {
  if (!NEWDRYVE_API_ORIGIN) return null;
  try {
    const response = await fetch(`${NEWDRYVE_API_ORIGIN}${withSchool("/v1/organisations/me/removed-members", school)}`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    return readRemovedMembers(await response.json().catch(() => null));
  } catch {
    return null;
  }
}
