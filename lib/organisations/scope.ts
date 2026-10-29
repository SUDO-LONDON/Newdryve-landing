/**
 * Which school a portal request is about.
 *
 * An admin of one school never has to say; an admin of several, and a
 * Newdryve super admin always, must name one for the single-school routes
 * (422 `details.code = organisation_required`). The portal keeps that choice
 * in a cookie and adds it to every API call, so a super admin gets a school
 * picker instead of an error page (#499). Client-safe: no server imports.
 */

/** The chosen school's id. HttpOnly, scoped to the portal. */
export const SCHOOL_COOKIE = "nd_org_school";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** `path` with `organisation_id` added, unless it already names one or no school is chosen. */
export function withSchool(path: string, organisationId: string | null | undefined): string {
  if (!isUuid(organisationId)) return path;
  const [base, query = ""] = path.split("?", 2);
  const params = new URLSearchParams(query);
  if (params.has("organisation_id")) return path;
  params.set("organisation_id", organisationId);
  return `${base}?${params.toString()}`;
}

/**
 * A JSON write body with `organisation_id` added when it is an object that
 * names none. Anything else (no body, an array, not JSON) is sent unchanged:
 * a bodyless write is scoped by the query string instead.
 */
export function withSchoolBody(body: string, organisationId: string | null | undefined): string {
  if (!isUuid(organisationId)) return body;
  const text = body.trim();
  if (!text) return body;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return body;
    const record = parsed as Record<string, unknown>;
    if (record.organisation_id) return body;
    return JSON.stringify({ ...record, organisation_id: organisationId });
  } catch {
    return body;
  }
}

/**
 * The API asking which school: `details.code = organisation_required`, or,
 * from an API that predates that code, a super admin's bare 422 "organisation_id
 * is required".
 */
export function isOrganisationRequired(status: number, code: string | null | undefined, message?: string | null): boolean {
  if (status !== 422) return false;
  if (code === "organisation_required") return true;
  return typeof message === "string" && /organisation_id is required|choose which organisation/i.test(message);
}

/** A portal path to return to after choosing, never another site or the auth routes. */
export function safePortalNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/organisations") || next.startsWith("//")) return "/organisations";
  if (next.startsWith("/organisations/auth") || next.startsWith("/organisations/api") || next.startsWith("/organisations/choose")) {
    return "/organisations";
  }
  return next;
}

export type PortalReadOutcome =
  | { kind: "ok" }
  | { kind: "login" }
  /** Not a school admin at all, or every school they had has been cancelled. */
  | { kind: "denied"; reason: "unavailable" | null }
  /** The API needs a school named, or the one chosen is no longer theirs. */
  | { kind: "choose"; reason: "required" | "stale" }
  | { kind: "error"; message: string };

/**
 * Where a server-rendered portal read goes from the API's answer. A 403 that
 * is not "school unavailable" while a school is chosen means that choice went
 * stale (removed as admin, school cancelled), so the admin chooses again rather
 * than being told they have no access at all.
 */
export function portalReadOutcome(
  status: number,
  error: { code: string | null; message: string },
  chosenSchool: string | null
): PortalReadOutcome {
  if (status >= 200 && status < 300) return { kind: "ok" };
  if (status === 401) return { kind: "login" };
  if (status === 403) {
    if (error.code === "organisation_unavailable") return { kind: "denied", reason: "unavailable" };
    return chosenSchool ? { kind: "choose", reason: "stale" } : { kind: "denied", reason: null };
  }
  if (isOrganisationRequired(status, error.code, error.message)) return { kind: "choose", reason: "required" };
  return { kind: "error", message: error.message };
}
