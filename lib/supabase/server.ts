// Server-side Supabase client for React Server Components and Route Handlers.
// Cookie-bound via @supabase/ssr so the authenticated founder session flows
// through to Postgres, where RLS enforces the allowlist.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/ops/env";
import { FOUNDER_PROOF_HEADER, verifyFounderHeader } from "@/lib/ops/session";
import { FOUNDER_EMAIL_HEADER } from "@/lib/supabase/middleware";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Session refresh is handled in middleware, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Convenience: the authenticated user's email, or null.
 *
 * The middleware forwards the founder it already verified as a request header
 * to save a second Supabase round trip. A header alone proves nothing (any
 * caller can send one, and some paths bypass the middleware), so it is used
 * only alongside the proof the middleware signs with OPS_SESSION_SECRET.
 */
export async function getSessionEmail(): Promise<string | null> {
  const requestHeaders = await headers();
  const forwardedEmail = requestHeaders.get(FOUNDER_EMAIL_HEADER);
  if (
    forwardedEmail &&
    (await verifyFounderHeader(forwardedEmail, requestHeaders.get(FOUNDER_PROOF_HEADER)))
  ) {
    return forwardedEmail;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}
