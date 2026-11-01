import { notFound } from "next/navigation";
import OrganisationDetailClient from "@/components/ops/OrganisationDetailClient";
import { getOrganisation, listOrganisationPromotions } from "@/lib/ops/organisations";
import type { Promotion } from "@/lib/organisations/promotions";
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

  // The offers are read separately, so a failure there (an API without the
  // promotions routes yet) leaves the rest of the page up and says so.
  let promotions: Promotion[] | null = null;
  let promotionsError: string | null = null;
  try {
    promotions = await listOrganisationPromotions(id, email);
  } catch (err) {
    promotionsError = err instanceof Error ? err.message : "Could not load the offers.";
  }

  return <OrganisationDetailClient organisation={organisation} promotions={promotions} promotionsError={promotionsError} />;
}
