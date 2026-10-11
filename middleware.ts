// Founder portal gate. RLS remains the database enforcement layer; this middleware
// handles fast founder gating, inactivity timeout, and Supabase cookie refresh.
import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseMiddlewareClient,
  FOUNDER_EMAIL_HEADER,
  passThroughWithoutForgedIdentity,
} from "@/lib/supabase/middleware";
import {
  isFounderEmail,
  OPS_SESSION_TIMEOUT_MINUTES,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "@/lib/ops/env";
import {
  createVerifiedFounderCookie,
  FOUNDER_PROOF_HEADER,
  OPS_REVERIFY_MS,
  readVerifiedFounderCookie,
  signFounderHeader,
  VERIFIED_COOKIE,
} from "@/lib/ops/session";

const LAST_ACTIVE_COOKIE = "ops_last_active";
const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://newdryve.com";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public QR receipt-capture handoff. The mobile page and its API are reached
  // by an unauthenticated phone, so they bypass the founder gate here; each of
  // those routes enforces its own auth (token capability for the phone-facing
  // upload/poll, requireFounder for session creation and consumption).
  // requireFounder trusts the founder-email header, so even on this bypass an
  // inbound copy of it must be stripped rather than passed through.
  if (pathname.startsWith("/ops/capture") || pathname.startsWith("/ops/api/capture")) {
    return passThroughWithoutForgedIdentity(request);
  }

  if (pathname === "/") {
    const hasOtpParams =
      request.nextUrl.searchParams.has("code") ||
      request.nextUrl.searchParams.has("token_hash");

    if (!hasOtpParams) return passThroughWithoutForgedIdentity(request);

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

  if (isLogin && !hasAuthCookie) return passThroughWithoutForgedIdentity(request);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (isLogin || isDenied) return passThroughWithoutForgedIdentity(request);
    const url = request.nextUrl.clone();
    url.pathname = "/ops/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const { supabase, setRequestHeader, response, applyAuthCookies } =
    createSupabaseMiddlewareClient(request);

  // Downstream handlers trust the email header only alongside a proof that
  // this middleware signed, so a header that reached them some other way is
  // ignored. Without OPS_SESSION_SECRET there is no proof and they fall back
  // to asking Supabase themselves.
  const forwardFounder = async (founderEmail: string) => {
    setRequestHeader(FOUNDER_EMAIL_HEADER, founderEmail);
    const proof = await signFounderHeader(founderEmail);
    if (proof) setRequestHeader(FOUNDER_PROOF_HEADER, proof);
  };

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

  // Fast path: a cookie signed within the last OPS_REVERIFY_MS vouches for
  // the founder without a Supabase round trip. It is deliberately not
  // re-issued here, so Supabase is asked again once it ages out. getSession()
  // reads the local session (refreshing it only when it has expired), so a
  // founder who signed out elsewhere, or whose token needs rotating, still
  // goes through Supabase rather than riding on the cookie.
  const verifiedEmail = activityExpired
    ? null
    : await readVerifiedFounderCookie(request.cookies.get(VERIFIED_COOKIE)?.value);
  if (verifiedEmail && isFounderEmail(verifiedEmail)) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      await forwardFounder(verifiedEmail);

      if (isLogin) {
        const url = request.nextUrl.clone();
        const next = sanitizeFounderNext(request.nextUrl.searchParams.get("next"));
        url.pathname = next;
        url.searchParams.delete("next");
        return applyAuthCookies(NextResponse.redirect(url));
      }

      const res = response();
      setLastActiveCookie(res, now);
      return res;
    }
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

  if (!isFounderEmail(email)) {
    if (isDenied) return response();
    const url = request.nextUrl.clone();
    url.pathname = "/ops/denied";
    return NextResponse.redirect(url);
  }

  if (email) await forwardFounder(email);

  if (isLogin) {
    const url = request.nextUrl.clone();
    const next = sanitizeFounderNext(request.nextUrl.searchParams.get("next"));
    url.pathname = next;
    url.searchParams.delete("next");
    return applyAuthCookies(NextResponse.redirect(url));
  }

  const res = response();
  if (email) await setOpsSessionCookies(res, email, now);
  return res;
}

export const config = {
  matcher: ["/", "/ops", "/ops/:path*"],
};

function sanitizeFounderNext(next: string | null): string {
  if (!next) return "/ops";
  if (next.startsWith("/ops") && next !== "/ops/login" && next !== "/ops/denied" && !next.startsWith("/ops/auth")) {
    return next;
  }
  return "/ops";
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

function setLastActiveCookie(res: NextResponse, now: number) {
  res.cookies.set(LAST_ACTIVE_COOKIE, String(now), {
    ...cookieOptions,
    maxAge: OPS_SESSION_TIMEOUT_MINUTES * 60,
  });
}

/** Called only after Supabase itself has confirmed the founder's session. */
async function setOpsSessionCookies(res: NextResponse, email: string, now: number) {
  setLastActiveCookie(res, now);
  const verified = await createVerifiedFounderCookie(email);
  if (verified) {
    res.cookies.set(VERIFIED_COOKIE, verified, {
      ...cookieOptions,
      maxAge: Math.floor(OPS_REVERIFY_MS / 1000),
    });
  }
}
