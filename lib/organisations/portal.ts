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
 */
export async function orgProxy(request: Request, path: string, method: "GET" | "POST" | "PUT"): Promise<Response> {
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

  let upstream: Response;
  try {
    upstream = await fetch(`${NEWDRYVE_API_ORIGIN}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(method === "GET" ? {} : { "content-type": "application/json" }),
      },
      body: method === "GET" ? undefined : await request.text(),
      cache: "no-store",
    });
  } catch {
    return json({ error: "Could not reach Newdryve. Try again." }, 502);
  }
  const body = (await upstream.json().catch(() => null)) as { error?: { message?: string } | string } | null;
  if (!upstream.ok) {
    const message = typeof body?.error === "string" ? body.error : body?.error?.message || "Something went wrong.";
    return json({ error: message }, upstream.status);
  }
  return json(body, upstream.status);
}
