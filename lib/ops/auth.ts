import "server-only";

// Server-side founder guard for /ops API route handlers. Defence in depth:
// middleware already gates /ops, but every mutating/reading API route must
// re-verify the session server-side and never trust the client.
import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/supabase/server";
import { isFounderEmail } from "@/lib/ops/env";

export type FounderGuard = { email: string } | { error: NextResponse };

export async function requireFounder(): Promise<FounderGuard> {
  const email = await getSessionEmail();
  if (!email || !isFounderEmail(email)) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { email };
}

export function isGuardError(g: FounderGuard): g is { error: NextResponse } {
  return "error" in g;
}
