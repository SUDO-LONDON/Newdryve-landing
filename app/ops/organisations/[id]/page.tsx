import { notFound } from "next/navigation";
import OrganisationDetailClient from "@/components/ops/OrganisationDetailClient";
import { getOrganisation, listOrganisationAdmins } from "@/lib/ops/organisations";
import { getSessionEmail } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OrganisationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const email = (await getSessionEmail()) || "";
  const organisation = await getOrganisation(id, email);
  if (!organisation) notFound();
  // The page still renders if the list can't be read: the rest of it is how
  // a founder fixes things.
  const admins = await listOrganisationAdmins(id, email).catch(() => null);

  return <OrganisationDetailClient organisation={organisation} admins={admins} />;
}
