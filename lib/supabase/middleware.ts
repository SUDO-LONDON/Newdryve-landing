// Session-refresh Supabase client for Next.js middleware. Reads/writes cookies
// on the request/response pair so the founder's session stays fresh on every
// /ops request. Returns both the client and the response whose cookies must be
// propagated by the caller.
//
// Supabase rotates the refresh token on every refresh: the old one is consumed
// server-side the moment a new one is issued. So any Set-Cookie Supabase writes
// here MUST reach the browser. If it doesn't, the browser keeps replaying the
// consumed token and Supabase answers "AuthApiError: Invalid Refresh Token:
// Refresh Token Not Found" — once per request, forever. Hence applyAuthCookies,
// and hence the pending-cookie list below surviving response rebuilds.
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/ops/env";

/** Header this middleware uses to forward the verified founder identity. */
export const FOUNDER_EMAIL_HEADER = "x-ops-founder-email";

type PendingCookie = { name: string; value: string; options?: CookieOptions };

export function createSupabaseMiddlewareClient(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  // Never trust an inbound value: downstream route handlers treat this header
  // as proof of identity, so a client-supplied one would be an auth bypass.
  requestHeaders.delete(FOUNDER_EMAIL_HEADER);

  // Session cookies Supabase has written during this request. Held separately
  // because the response is rebuilt whenever request headers change, and a
  // rebuild would otherwise discard the freshly rotated tokens.
  const pending: PendingCookie[] = [];

  const build = () => {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    pending.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  };

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach((cookie) => {
          const existing = pending.findIndex((p) => p.name === cookie.name);
          if (existing >= 0) pending[existing] = cookie;
          else pending.push(cookie);
        });
      },
    },
  });

  return {
    supabase,

    setRequestHeader(name: string, value: string) {
      requestHeaders.set(name, value);
    },

    /** Pass-through response carrying any refreshed session cookies. */
    response: build,

    /**
     * Copy refreshed session cookies onto a response built by the caller.
     * Every NextResponse.redirect(...) in the middleware must call this — a
     * redirect is a brand-new response and starts with no Set-Cookie headers.
     */
    applyAuthCookies<T extends NextResponse>(target: T): T {
      pending.forEach(({ name, value, options }) => target.cookies.set(name, value, options));
      return target;
    },

    /**
     * Expire the Supabase auth cookies. Used when the session is known dead, so
     * the browser stops replaying a token that can never refresh again.
     */
    clearAuthCookies<T extends NextResponse>(target: T): T {
      request.cookies
        .getAll()
        .filter((cookie) => cookie.name.startsWith("sb-"))
        .forEach((cookie) => target.cookies.set(cookie.name, "", { path: "/", maxAge: 0 }));
      return target;
    },
  };
}

/**
 * Pass-through response for routes that skip the Supabase client entirely,
 * with the forgeable identity header stripped.
 */
export function passThroughWithoutForgedIdentity(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(FOUNDER_EMAIL_HEADER);
  return NextResponse.next({ request: { headers: requestHeaders } });
}
