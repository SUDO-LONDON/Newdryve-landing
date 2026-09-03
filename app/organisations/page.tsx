import { redirect } from "next/navigation";
import OrganisationPortalClient from "@/components/organisations/OrganisationPortalClient";
import { OrganisationPortalApiError, loadOrganisationPortal } from "@/lib/organisations/api";
import { assertOrganisationPortalEnv } from "@/lib/organisations/env";
import { createOrganisationSupabaseServerClient, getOrganisationAccessToken } from "@/lib/organisations/supabase-server";

export const dynamic = "force-dynamic";

export default async function OrganisationsPage() {
  assertOrganisationPortalEnv();
  const token = await getOrganisationAccessToken();
  if (!token) redirect("/organisations/login");

  const supabase = await createOrganisationSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const organisations = await loadOrganisationPortal(token);
    return <OrganisationPortalClient organisations={organisations} email={user?.email ?? null} />;
  } catch (error) {
    if (error instanceof OrganisationPortalApiError && error.status === 401) {
      redirect("/organisations/login");
    }
    if (error instanceof OrganisationPortalApiError && error.status === 403) {
      redirect("/organisations/denied");
    }
    throw error;
  }
}
