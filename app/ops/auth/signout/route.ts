// Sign the founder out and clear the inactivity cookie. Posted from the nav.
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const res = NextResponse.redirect(new URL("/ops/login", request.url), { status: 303 });
  res.cookies.delete("ops_last_active");
  return res;
}
