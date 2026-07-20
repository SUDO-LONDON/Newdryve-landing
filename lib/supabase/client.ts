"use client";

// Browser Supabase client for client components (inline board edits, kanban
// drag-and-drop, magic-link request). RLS still applies — this key is public
// and every query is gated by the founder allowlist policies in Postgres.
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/ops/env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (cached) return cached;
  cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cached;
}
