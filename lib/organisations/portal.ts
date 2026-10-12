import "server-only";

import { redirect } from "next/navigation";
import { NEWDRYVE_API_ORIGIN, assertOrganisationPortalEnv } from "@/lib/organisations/env";
import { getOrganisationAccessToken } from "@/lib/organisations/supabase-server";
import { OrganisationPortalApiError } from "@/lib/organisations/api";

/**
 * Read a school-portal endpoint for a server-rendered page, as the signed-in
 * admin. A missing or expired session goes to the login page, and a login
 * that is not a school admin goes to the denied page, rather than rendering a
 * portal full of zeroes that looks like a quiet week.
 */
export async function orgRead<T>(path: string): Promise<T> {
  assertOrganisationPortalEnv();
  const token = await getOrganisationAccessToken();
  if (!token) redirect("/organisations/login");

  let response: Response;
  try {
    response = await fetch(`${NEWDRYVE_API_ORIGIN}${path}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new OrganisationPortalApiError("Could not reach Newdryve.", 502);
  }
  if (response.status === 401) redirect("/organisations/login");
  if (response.status === 403) redirect("/organisations/denied");
  const body = (await response.json().catch(() => null)) as (T & { error?: { message?: string } }) | null;
  if (!response.ok || !body) {
    throw new OrganisationPortalApiError(body?.error?.message || "Could not load this page.", response.status);
  }
  return body;
}

/**
 * Forward a browser request from the portal to the API with the admin's
 * session, for the portal's own route handlers.
 *
 * Writes must come from this site: the session cookie is SameSite=Lax, and
 * checking Origin as well means a form on another site can never act as a
 * signed-in school admin.
 *
 * Errors come back as `{ error: message, code?, details? }`: the message as a
 * string, which every portal form already reads, plus the API's
 * machine-readable reason (`details.code`, else the envelope's `code`) so a
 * form can tell, say, "fee terms are Newdryve's" from a bad sort code.
 */
export async function orgProxy(
  request: Request,
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE"
): Promise<Response> {
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

  if (method !== "GET") {
    // Compared with the host the browser asked for, not request.url: behind
    // the landing router (and Railway) Next sees its own internal address.
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return json({ error: "This request did not come from the organisation portal." }, 403);
    }
  }
  if (!NEWDRYVE_API_ORIGIN) return json({ error: "The organisation portal is not configured." }, 503);
  const token = await getOrganisationAccessToken();
  if (!token) return json({ error: "Your session has ended. Sign in again." }, 401);

  // Fastify rejects a request that declares a JSON body and sends none, so a
  // bodyless write (DELETE, mark-as-read) goes without the header.
  const body = method === "GET" ? "" : await request.text();
  const hasBody = body.trim().length > 0;

  let upstream: Response;
  try {
    upstream = await fetch(`${NEWDRYVE_API_ORIGIN}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? body : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(method === "GET" ? 10_000 : 20_000),
    });
  } catch {
    return json({ error: "Could not reach Newdryve. Try again." }, 502);
  }
  const upstreamBody = (await upstream.json().catch(() => null)) as {
    error?: { message?: string; code?: string; details?: Record<string, unknown> } | string;
  } | null;
  if (!upstream.ok) {
    const error = upstreamBody?.error;
    if (typeof error === "string") return json({ error }, upstream.status);
    const details = error?.details && typeof error.details === "object" ? error.details : undefined;
    const code = typeof details?.code === "string" ? details.code : error?.code;
    return json(
      {
        error: error?.message || "Something went wrong.",
        ...(code ? { code } : {}),
        ...(details ? { details } : {}),
      },
      upstream.status
    );
  }
  return json(upstreamBody, upstream.status);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A uuid from a route param or query string, or null. Never interpolate anything else into an API path. */
export function uuidOrNull(value: string | null | undefined): string | null {
  return value && UUID.test(value) ? value : null;
}
