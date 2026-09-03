import { NextResponse } from "next/server";
import { createOrganisationSupabaseServerClient } from "@/lib/organisations/supabase-server";

export async function POST(request: Request) {
  const supabase = await createOrganisationSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/organisations/login", request.url), 303);
}
