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

/**
 * The CEO email. The CEO is the only founder permitted to create/assign weekly
 * KPIs. Mirrored in Postgres by ops_is_ceo() (allowlist role = 'CEO').
 */
export const CEO_EMAIL: string = (process.env.OPS_CEO_EMAIL || "sinan@newdryve.com")
  .trim()
  .toLowerCase();

/** Case-insensitive CEO check. */
export function isCeoEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === CEO_EMAIL;
}

/**
 * Discord incoming webhook for delivery-pipeline notifications (SECRET,
 * server-only). Unset simply disables notifications — the pipeline itself
 * keeps working, so a missing webhook is never a hard failure.
 */
export const DISCORD_WEBHOOK_URL: string = (process.env.OPS_DISCORD_WEBHOOK_URL || "").trim();

/**
 * Founder email -> Discord user id, as a JSON object string, e.g.
 *   OPS_DISCORD_USER_IDS='{"deniz@newdryve.com":"123456789012345678"}'
 * Only ids listed here are ever mentioned, which is also what stops a node
 * title from being able to trigger a mass ping.
 */
const DISCORD_USER_IDS: Record<string, string> = (() => {
  const raw = (process.env.OPS_DISCORD_USER_IDS || "").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [email, id] of Object.entries(parsed)) {
      if (typeof id === "string" && id.trim()) out[email.trim().toLowerCase()] = id.trim();
    }
    return out;
  } catch {
    // Bad JSON must not take the portal down; mentions degrade to plain names.
    return {};
  }
})();

/** Discord user id for a founder, or null if we have no mapping. */
export function discordIdFor(email: string | null | undefined): string | null {
  if (!email) return null;
  return DISCORD_USER_IDS[email.trim().toLowerCase()] ?? null;
}

/** Absolute base URL of the ops portal, used for deep links in notifications. */
export const OPS_BASE_URL: string = (
  process.env.OPS_BASE_URL || "https://newdryve.com"
).replace(/\/$/, "");

/** Fail fast in server contexts if core Supabase config is missing. */
export function assertSupabaseEnv(): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
}
