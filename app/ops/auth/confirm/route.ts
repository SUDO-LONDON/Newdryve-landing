// Magic-link callback. Supabase redirects here after the founder clicks the
// email link. Supports both the PKCE `code` flow (same-device) and the
// `token_hash` OTP flow (cross-device, if the email template is configured for
// it). After establishing the session we re-check the allowlist server-side.
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFounderEmail, OPS_SESSION_TIMEOUT_MINUTES } from "@/lib/ops/env";
import { createVerifiedFounderCookie, VERIFIED_COOKIE } from "@/lib/ops/session";

const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://newdryve.com";
const LAST_ACTIVE_COOKIE = "ops_last_active";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeNext(searchParams.get("next"));

  const supabase = await createSupabaseServerClient();

  let email: string | undefined;
  let ok = false;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    email = data.user?.email ?? undefined;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
    email = data.user?.email ?? undefined;
  }

  if (ok && !email) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? undefined;
  }

  if (!ok) {
    return NextResponse.redirect(opsUrl("/ops/login?error=1"));
  }

  // Enforce the allowlist immediately — a valid session for a non-founder must
  // not be allowed to persist.
  if (!email || !(await isAllowedFounder(supabase, email))) {
    await supabase.auth.signOut();
    return NextResponse.redirect(opsUrl("/ops/denied"));
  }

  const res = NextResponse.redirect(opsUrl(next));
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/ops",
    maxAge: OPS_SESSION_TIMEOUT_MINUTES * 60,
  } as const;
  res.cookies.set(LAST_ACTIVE_COOKIE, String(Date.now()), cookieOptions);
  res.cookies.set(VERIFIED_COOKIE, await createVerifiedFounderCookie(email), cookieOptions);
  return res;
}

// Only permit same-origin /ops paths as the post-login destination.
function sanitizeNext(next: string | null): string {
  if (!next || !next.startsWith("/ops")) return "/ops";
  if (next === "/ops/login" || next === "/ops/denied" || next.startsWith("/ops/auth")) {
    return "/ops";
  }
  return next;
}

function opsUrl(path: string): URL {
  return new URL(path, PUBLIC_SITE_URL);
}

async function isAllowedFounder(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  email: string
): Promise<boolean> {
  if (isFounderEmail(email)) return true;

  const { data, error } = await supabase
    .from("ops_allowlist")
    .select("email")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  return !error && !!data;
}
