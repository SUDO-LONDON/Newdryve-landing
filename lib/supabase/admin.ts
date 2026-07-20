import "server-only";

// Service-role Supabase client. BYPASSES RLS — use only in server code after
// the caller's founder identity has already been verified (getSessionEmail +
// isFounderEmail). Reserved for: signed-URL generation for the private
// data-room bucket, storage writes, audit-log inserts, and GDPR hard-deletes.
// Never import this into a client component or expose the key to the browser.
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/ops/env";

let cached: ReturnType<typeof createClient> | null = null;

export function createSupabaseAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  if (cached) return cached;
  cached = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
