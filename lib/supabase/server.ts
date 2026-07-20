// Server-side Supabase client for React Server Components and Route Handlers.
// Cookie-bound via @supabase/ssr so the authenticated founder session flows
// through to Postgres, where RLS enforces the allowlist.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/ops/env";

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

/** Convenience: the authenticated user's email, or null. */
export async function getSessionEmail(): Promise<string | null> {
  const forwardedEmail = (await headers()).get("x-ops-founder-email");
  if (forwardedEmail) return forwardedEmail;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}
