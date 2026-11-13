/**
 * Instructors a school removed, who cannot rejoin it with the school code
 * until the school unbans them (Newdryve ADR-072, #644). Read from
 * `GET /v1/organisations/me/removed-members`; unbanned through
 * `POST /v1/organisations/me/removed-members/:instructorId/reinvite`.
 * Client-safe.
 */

export interface RemovedMember {
  organisation_id: string;
  instructor_id: string;
  display_name: string;
  email: string | null;
  removed_at: string;
}

/** The list from a response body, keeping only well-formed rows. */
export function readRemovedMembers(body: unknown): RemovedMember[] {
  const items = body && typeof body === "object" ? (body as { items?: unknown }).items : null;
  if (!Array.isArray(items)) return [];
  return items.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const r = row as Record<string, unknown>;
    if (typeof r.organisation_id !== "string" || typeof r.instructor_id !== "string" || typeof r.removed_at !== "string") return [];
    return [{
      organisation_id: r.organisation_id,
      instructor_id: r.instructor_id,
      display_name: typeof r.display_name === "string" && r.display_name.trim() ? r.display_name : "Instructor",
      email: typeof r.email === "string" && r.email ? r.email : null,
      removed_at: r.removed_at,
    }];
  });
}

/** The browser endpoint that unbans one instructor. */
export function reinviteEndpoint(instructorId: string): string {
  return `/organisations/api/removed-members/${encodeURIComponent(instructorId)}/reinvite`;
}
