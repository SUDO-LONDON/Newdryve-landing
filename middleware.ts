// Ops portal gate. RLS remains the database enforcement layer; this middleware
// handles fast founder gating, inactivity timeout, and Supabase cookie refresh.
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import {
  isFounderEmail,
  OPS_SESSION_TIMEOUT_MINUTES,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "@/lib/ops/env";
import {
  createVerifiedFounderCookie,
  readVerifiedFounderCookie,
  VERIFIED_COOKIE,
} from "@/lib/ops/session";

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
  const isAuthRoute = pathname.startsWith("/ops/auth");
  const isDenied = pathname === "/ops/denied";

  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (isLogin && !hasAuthCookie) return NextResponse.next();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (isLogin || isDenied) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/ops/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const { supabase, setRequestHeader, response } = createSupabaseMiddlewareClient(request);

  if (isAuthRoute) return response();

  const now = Date.now();
  const timeoutMs = OPS_SESSION_TIMEOUT_MINUTES * 60 * 1000;
  const lastCookie = request.cookies.get(LAST_ACTIVE_COOKIE);
  const last = Number(lastCookie?.value || "0");
  const activityExpired =
    !lastCookie || !Number.isFinite(last) || !last || now - last > timeoutMs;

  if (activityExpired && !isLogin && !isDenied) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/ops/login";
    url.searchParams.set("timeout", "1");
    const timedOut = NextResponse.redirect(url);
    timedOut.cookies.delete(LAST_ACTIVE_COOKIE);
    timedOut.cookies.delete(VERIFIED_COOKIE);
    return timedOut;
  }

  const verifiedEmail = activityExpired
    ? null
    : await readVerifiedFounderCookie(request.cookies.get(VERIFIED_COOKIE)?.value, timeoutMs);
  if (verifiedEmail && isFounderEmail(verifiedEmail)) {
    setRequestHeader("x-ops-founder-email", verifiedEmail);

    if (isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/ops";
      url.searchParams.delete("next");
      return NextResponse.redirect(url);
    }

    const res = response();
    await setOpsSessionCookies(res, verifiedEmail, now);
    return res;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? null;

  if (!user) {
    if (isLogin) return response();
    const url = request.nextUrl.clone();
    url.pathname = "/ops/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!(await isAllowedFounder(supabase, email))) {
    if (isDenied) return response();
    const url = request.nextUrl.clone();
    url.pathname = "/ops/denied";
    return NextResponse.redirect(url);
  }

  if (email) setRequestHeader("x-ops-founder-email", email);

  if (isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/ops";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  const res = response();
  if (email) await setOpsSessionCookies(res, email, now);
  return res;
}

export const config = {
  matcher: ["/", "/ops", "/ops/:path*"],
};

async function isAllowedFounder(
  supabase: ReturnType<typeof createSupabaseMiddlewareClient>["supabase"],
  email: string | null
): Promise<boolean> {
  if (!email) return false;
  if (isFounderEmail(email)) return true;

  const { data, error } = await supabase
    .from("ops_allowlist")
    .select("email")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  return !error && !!data;
}

async function setOpsSessionCookies(res: NextResponse, email: string, now: number) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/ops",
    maxAge: OPS_SESSION_TIMEOUT_MINUTES * 60,
  };

  res.cookies.set(LAST_ACTIVE_COOKIE, String(now), cookieOptions);
  res.cookies.set(VERIFIED_COOKIE, await createVerifiedFounderCookie(email), cookieOptions);
}
