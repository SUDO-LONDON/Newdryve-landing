import { redirect } from "next/navigation";
import OrganisationPortalClient from "@/components/organisations/OrganisationPortalClient";
import { OrganisationPortalApiError, loadOrganisationPortal } from "@/lib/organisations/api";
import { assertOrganisationPortalEnv } from "@/lib/organisations/env";
import { loadRemovedMembers } from "@/lib/organisations/removed-members-server";
import { getChosenSchool } from "@/lib/organisations/school";
import { getOrganisationAccessToken } from "@/lib/organisations/supabase-server";

export const dynamic = "force-dynamic";

export default async function OrganisationsPage() {
  assertOrganisationPortalEnv();
  const token = await getOrganisationAccessToken();
  if (!token) redirect("/organisations/login");

  let data;
  try {
    data = await loadOrganisationPortal(token);
  } catch (error) {
    if (error instanceof OrganisationPortalApiError && error.status === 401) {
      redirect("/organisations/login");
    }
    if (error instanceof OrganisationPortalApiError && error.status === 403) {
      redirect("/organisations/denied");
    }
    throw error;
  }
  // A school chosen in the picker narrows the overview the same way it
  // narrows every other tab. One that is no longer in the list is ignored.
  const school = await getChosenSchool();
  const chosen = school ? data.organisations.filter((org) => org.id === school) : [];
  // Read after the overview, so a login the overview turned away never gets here.
  const removed = data.organisations.length ? await loadRemovedMembers(token, chosen.length ? school : null) : null;
  return (
    <OrganisationPortalClient
      organisations={chosen.length ? chosen : data.organisations}
      unavailable={data.unavailable}
      removed={removed}
    />
  );
}
