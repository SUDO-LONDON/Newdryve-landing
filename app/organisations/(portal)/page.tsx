import { redirect } from "next/navigation";
import OrganisationPortalClient from "@/components/organisations/OrganisationPortalClient";
import { OrganisationPortalApiError, loadOrganisationPortal } from "@/lib/organisations/api";
import { assertOrganisationPortalEnv } from "@/lib/organisations/env";
import { getOrganisationAccessToken } from "@/lib/organisations/supabase-server";

export const dynamic = "force-dynamic";

export default async function OrganisationsPage() {
  assertOrganisationPortalEnv();
  const token = await getOrganisationAccessToken();
  if (!token) redirect("/organisations/login");

  let organisations;
  try {
    organisations = await loadOrganisationPortal(token);
  } catch (error) {
    if (error instanceof OrganisationPortalApiError && error.status === 401) {
      redirect("/organisations/login");
    }
    if (error instanceof OrganisationPortalApiError && error.status === 403) {
      redirect("/organisations/denied");
    }
    throw error;
  }
  return <OrganisationPortalClient organisations={organisations} />;
}
