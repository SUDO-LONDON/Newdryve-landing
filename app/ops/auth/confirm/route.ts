// Magic-link callback. Supabase redirects here after the founder clicks the
// email link. Supports both the PKCE `code` flow (same-device) and the
// `token_hash` OTP flow (cross-device, if the email template is configured for
// it). After establishing the session we re-check the allowlist server-side.
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFounderEmail } from "@/lib/ops/env";

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

  if (!ok) {
    return NextResponse.redirect(new URL("/ops/login?error=1", request.url));
  }

  // Enforce the allowlist immediately — a valid session for a non-founder must
  // not be allowed to persist.
  if (!isFounderEmail(email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/ops/denied", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}

// Only permit same-origin /ops paths as the post-login destination.
function sanitizeNext(next: string | null): string {
  if (!next || !next.startsWith("/ops")) return "/ops";
  return next;
}
