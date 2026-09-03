import { Suspense } from "react";
import { redirect } from "next/navigation";
import OrganisationLoginClient from "@/components/organisations/OrganisationLoginClient";
import { assertOrganisationPortalEnv } from "@/lib/organisations/env";
import { createOrganisationSupabaseServerClient } from "@/lib/organisations/supabase-server";

export const dynamic = "force-dynamic";

function sanitizeNext(next: string | string[] | undefined): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value) return "/organisations";
  return value.startsWith("/organisations") && !value.startsWith("/organisations/auth")
    ? value
    : "/organisations";
}

export default async function OrganisationsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  assertOrganisationPortalEnv();
  const supabase = await createOrganisationSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const next = sanitizeNext((await searchParams).next);
  if (session?.access_token) redirect(next);

  return (
    <Suspense fallback={null}>
      <OrganisationLoginClient next={next} />
    </Suspense>
  );
}
