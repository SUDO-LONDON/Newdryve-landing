/**
 * Schools that have been cancelled on Newdryve (#499, Newdryve ADR-060). A
 * school has no membership of its own and is never paused: it is active or
 * cancelled (stored as `closed`). `GET /v1/organisations/me` lists cancelled
 * schools as `unavailable`, and every other portal route answers 403
 * `details.code = organisation_unavailable` with the same list once the admin
 * has no active school left. The portal says so in words rather than "not
 * linked to an organisation". Client-safe.
 */

export interface UnavailableOrganisation {
  id: string;
  name: string;
  status: "closed";
}

/** The list from a response or error details, keeping only well-formed rows. */
export function readUnavailable(value: unknown): UnavailableOrganisation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const { id, name, status } = row as Record<string, unknown>;
    if (typeof id !== "string" || status !== "closed") return [];
    return [{ id, name: typeof name === "string" && name.trim() ? name : "Your school", status }];
  });
}

export interface UnavailableNotice {
  title: string;
  body: string;
}

/** What to tell an admin about the schools they can no longer open. */
export function unavailableNotice(list: UnavailableOrganisation[]): UnavailableNotice | null {
  if (!list.length) return null;
  const contact = "Contact Newdryve if you think this is a mistake.";
  const ended = "Its instructors' seats have ended, and no fees are raised for any week after it was cancelled.";
  if (list.length === 1) {
    const [org] = list;
    return {
      title: "This school has been cancelled",
      body: `${org!.name} has been cancelled on Newdryve, so its portal is no longer available. ${ended} ${contact}`,
    };
  }
  return {
    title: "These schools have been cancelled",
    body: `Cancelled on Newdryve: ${list.map((o) => o.name).join(", ")}. Their instructors' seats have ended. ${contact}`,
  };
}
