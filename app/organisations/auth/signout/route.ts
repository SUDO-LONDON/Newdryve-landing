import { NextResponse } from "next/server";
import { SCHOOL_COOKIE } from "@/lib/organisations/scope";
import { createOrganisationSupabaseServerClient } from "@/lib/organisations/supabase-server";

export async function POST(request: Request) {
  const supabase = await createOrganisationSupabaseServerClient();
  await supabase.auth.signOut();
  const response = NextResponse.redirect(new URL("/organisations/login", request.url), 303);
  // The next login on this browser chooses its own school.
  response.cookies.delete({ name: SCHOOL_COOKIE, path: "/organisations" });
  return response;
}
