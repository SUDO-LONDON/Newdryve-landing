import { notFound } from "next/navigation";
import OrganisationDetailClient from "@/components/ops/OrganisationDetailClient";
import { getOrganisation } from "@/lib/ops/organisations";
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

  return <OrganisationDetailClient organisation={organisation} />;
}
