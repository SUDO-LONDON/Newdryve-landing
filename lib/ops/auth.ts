import "server-only";

// Server-side founder guard for /ops API route handlers. Defence in depth:
// middleware already gates /ops, but every mutating/reading API route must
// re-verify the session server-side and never trust the client.
import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/supabase/server";
import { isCeoEmail, isFounderEmail } from "@/lib/ops/env";

export type FounderGuard = { email: string } | { error: NextResponse };

export async function requireFounder(): Promise<FounderGuard> {
  const email = await getSessionEmail();
  if (!email || !isFounderEmail(email)) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { email };
}

/**
 * Stricter guard for CEO-only actions (e.g. creating/assigning KPIs). Returns
 * 403 for an allowlisted founder who is not the CEO, 401 for everyone else.
 */
export async function requireCeo(): Promise<FounderGuard> {
  const email = await getSessionEmail();
  if (!email || !isFounderEmail(email)) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (!isCeoEmail(email)) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { email };
}

export function isGuardError(g: FounderGuard): g is { error: NextResponse } {
  return "error" in g;
}
