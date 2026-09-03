import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PRODUCT_SUPABASE_ANON_KEY, PRODUCT_SUPABASE_URL } from "@/lib/organisations/env";

export async function createOrganisationSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(PRODUCT_SUPABASE_URL, PRODUCT_SUPABASE_ANON_KEY, {
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
          // Server Components cannot always write cookies. Login/signout routes
          // handle durable mutations; this path only reads the current session.
        }
      },
    },
  });
}

export async function getOrganisationAccessToken(): Promise<string | null> {
  const supabase = await createOrganisationSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
