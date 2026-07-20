// Ops portal gate — the FIRST of two enforcement layers (RLS is the second).
// Every /ops request passes through here: session is refreshed, the founder
// allowlist is checked, and an inactivity timeout is enforced. No /ops page,
// API route or asset is reachable without an allowlisted, active session.
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import {
  isFounderEmail,
  OPS_SESSION_TIMEOUT_MINUTES,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "@/lib/ops/env";

const LAST_ACTIVE_COOKIE = "ops_last_active";
const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://newdryve.com";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const hasOtpParams =
      request.nextUrl.searchParams.has("code") ||
      request.nextUrl.searchParams.has("token_hash");

    if (!hasOtpParams) return NextResponse.next();

    const url = new URL("/ops/auth/confirm", PUBLIC_SITE_URL);
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    url.pathname = "/ops/auth/confirm";
    if (!url.searchParams.has("next")) {
      url.searchParams.set("next", "/ops");
    }
    return NextResponse.redirect(url);
  }

  const isLogin = pathname === "/ops/login";
  const isAuthRoute = pathname.startsWith("/ops/auth"); // confirm + signout callbacks
  const isDenied = pathname === "/ops/denied";

  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  // Let unauthenticated founders reach the login page even if the deployed
  // service is missing Supabase env. Without this, the middleware crashes before
  // the static login page can render.
  if (isLogin && !hasAuthCookie) return NextResponse.next();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (isLogin || isDenied) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/ops/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const { supabase, response } = createSupabaseMiddlewareClient(request);

  // The auth callback routes must run to set/clear the session cookie.
  if (isAuthRoute) return response();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? null;

  // Unauthenticated → login (except the login page itself).
  if (!user) {
    if (isLogin) return response();
    const url = request.nextUrl.clone();
    url.pathname = "/ops/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated but not on the founder allowlist → denied.
  if (!isFounderEmail(email)) {
    if (isDenied) return response();
    const url = request.nextUrl.clone();
    url.pathname = "/ops/denied";
    return NextResponse.redirect(url);
  }

  // Allowlisted founder. Enforce sliding inactivity timeout.
  const now = Date.now();
  const last = Number(request.cookies.get(LAST_ACTIVE_COOKIE)?.value || "0");
  const timeoutMs = OPS_SESSION_TIMEOUT_MINUTES * 60 * 1000;
  if (last && now - last > timeoutMs) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/ops/login";
    url.searchParams.set("timeout", "1");
    const timedOut = NextResponse.redirect(url);
    timedOut.cookies.delete(LAST_ACTIVE_COOKIE);
    return timedOut;
  }

  // Signed-in founder landing on the login page → dashboard.
  if (isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/ops";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  // Continue, refreshing the activity window and any rotated auth cookies.
  const res = response();
  res.cookies.set(LAST_ACTIVE_COOKIE, String(now), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/ops",
    maxAge: OPS_SESSION_TIMEOUT_MINUTES * 60,
  });
  return res;
}

export const config = {
  matcher: ["/", "/ops", "/ops/:path*"],
};
