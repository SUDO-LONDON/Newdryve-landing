import OrganisationsClient from "@/components/ops/OrganisationsClient";
import { listOrganisations } from "@/lib/ops/organisations";
import { getSessionEmail } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OrganisationsPage() {
  const email = (await getSessionEmail()) || "";
  const organisations = await listOrganisations(email);

  return <OrganisationsClient organisations={organisations} />;
}
