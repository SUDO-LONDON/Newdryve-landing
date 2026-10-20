/**
 * Schools Newdryve has paused or closed (#499). `GET /v1/organisations/me`
 * lists them as `unavailable`, and every other portal route answers 403
 * `details.code = organisation_unavailable` with the same list once the admin
 * has no active school left. The portal says so in words rather than "not
 * linked to an organisation". Client-safe.
 */

export interface UnavailableOrganisation {
  id: string;
  name: string;
  status: "paused" | "closed";
}

/** The list from a response or error details, keeping only well-formed rows. */
export function readUnavailable(value: unknown): UnavailableOrganisation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const { id, name, status } = row as Record<string, unknown>;
    if (typeof id !== "string" || (status !== "paused" && status !== "closed")) return [];
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
  if (list.length === 1) {
    const [org] = list;
    return org!.status === "paused"
      ? {
          title: "This school is paused by Newdryve",
          body: `${org!.name} is paused, so its portal is closed for now. Its instructors, lessons and invoices are kept and come back when Newdryve reactivates it. ${contact}`,
        }
      : {
          title: "This school is closed",
          body: `${org!.name} has been closed on Newdryve, so its portal is no longer available. ${contact}`,
        };
  }
  const paused = list.filter((o) => o.status === "paused");
  const closed = list.filter((o) => o.status === "closed");
  const parts = [
    paused.length ? `Paused by Newdryve: ${paused.map((o) => o.name).join(", ")}.` : "",
    closed.length ? `Closed: ${closed.map((o) => o.name).join(", ")}.` : "",
  ].filter(Boolean);
  return {
    title: closed.length === 0 ? "These schools are paused by Newdryve" : paused.length === 0 ? "These schools are closed" : "These schools are paused or closed",
    body: `${parts.join(" ")} ${contact}`,
  };
}
