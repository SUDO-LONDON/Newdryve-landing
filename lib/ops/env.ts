// Central configuration for the /ops founder portal.
//
// Security note: the founder allowlist is enforced in BOTH layers — this env
// list gates the Next.js middleware (fast, per-request), and the identical set
// is seeded into the `ops_allowlist` table which every RLS policy consults.
// Keep the two in sync: update OPS_FOUNDER_ALLOWLIST here and re-run the
// allowlist seed migration.

/** Supabase project URL (public). */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

/** Supabase anon/publishable key (public, RLS-gated). */
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Supabase service-role key (SECRET, server-only). Never expose to the client.
 * Used exclusively by lib/supabase/admin.ts for signed URLs, storage writes,
 * audit-log inserts and GDPR hard-deletes.
 */
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Comma-separated founder emails permitted into /ops. Anyone else who
 * authenticates is rejected regardless of having a valid Supabase account.
 */
export const FOUNDER_ALLOWLIST: string[] = (process.env.OPS_FOUNDER_ALLOWLIST || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Inactivity window (minutes) before a founder must re-authenticate. */
export const OPS_SESSION_TIMEOUT_MINUTES = Number(
  process.env.OPS_SESSION_TIMEOUT_MINUTES || "30"
);

/** Case-insensitive allowlist check used by middleware and server routes. */
export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return FOUNDER_ALLOWLIST.includes(email.trim().toLowerCase());
}

/** Fail fast in server contexts if core Supabase config is missing. */
export function assertSupabaseEnv(): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
}
