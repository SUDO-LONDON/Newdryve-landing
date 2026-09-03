// Sign the founder out and clear the inactivity cookie. Posted from the nav.
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VERIFIED_COOKIE } from "@/lib/ops/session";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const res = NextResponse.redirect(new URL("/ops/login", request.url), { status: 303 });
  res.cookies.delete("ops_last_active");
  res.cookies.delete(VERIFIED_COOKIE);
  res.cookies.set("ops_last_active", "", { path: "/", maxAge: 0 });
  res.cookies.set(VERIFIED_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set("ops_last_active", "", { path: "/ops", maxAge: 0 });
  res.cookies.set(VERIFIED_COOKIE, "", { path: "/ops", maxAge: 0 });
  return res;
}
