"use client";

import { createBrowserClient } from "@supabase/ssr";
import { PRODUCT_SUPABASE_ANON_KEY, PRODUCT_SUPABASE_URL } from "@/lib/organisations/env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function createOrganisationSupabaseBrowserClient() {
  if (cached) return cached;
  cached = createBrowserClient(PRODUCT_SUPABASE_URL, PRODUCT_SUPABASE_ANON_KEY);
  return cached;
}
