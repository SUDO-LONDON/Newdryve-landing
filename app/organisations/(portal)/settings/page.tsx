import type { Metadata } from "next";
import BillingSettingsForm from "@/components/organisations/BillingSettingsForm";
import CancellationPolicyForm, { type SchoolPolicy } from "@/components/organisations/CancellationPolicyForm";
import PromotionsForm, { type SchoolPromotions } from "@/components/organisations/PromotionsForm";
import { PageHeading } from "@/components/organisations/PortalShell";
import { OrganisationPortalApiError } from "@/lib/organisations/api";
import type { CancellationPolicyResponse } from "@/lib/organisations/cancellation-policy";
import { orgRead } from "@/lib/organisations/portal";
import type { PromotionsResponse } from "@/lib/organisations/promotions";
import type { BillingResponse } from "@/lib/organisations/types";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const billing = await orgRead<BillingResponse>("/v1/organisations/me/billing", { returnTo: "/organisations/settings" });
  // One policy per school, named explicitly: the policy routes need a single
  // school even for an admin of several.
  const schools: SchoolPolicy[] = await Promise.all(
    billing.organisations.map(async (org) => {
      try {
        const policy = await orgRead<CancellationPolicyResponse>(
          `/v1/organisations/me/cancellation-policy?organisation_id=${encodeURIComponent(org.id)}`,
          { returnTo: "/organisations/settings" }
        );
        return { id: org.id, name: org.name, policy };
      } catch (error) {
        // Only an API failure is shown in the form; a redirect (signed out,
        // school paused) must still happen.
        if (!(error instanceof OrganisationPortalApiError)) throw error;
        return { id: org.id, name: org.name, policy: null, error: error.message };
      }
    })
  );
  // The school's intro offers, read the same way: one read per school, and
  // only an API failure is shown in the panel.
  const offers: SchoolPromotions[] = await Promise.all(
    billing.organisations.map(async (org) => {
      try {
        const data = await orgRead<PromotionsResponse>(
          `/v1/organisations/me/promotions?organisation_id=${encodeURIComponent(org.id)}`,
          { returnTo: "/organisations/settings" }
        );
        return { id: org.id, name: org.name, promotions: data.promotions ?? [] };
      } catch (error) {
        if (!(error instanceof OrganisationPortalApiError)) throw error;
        return { id: org.id, name: org.name, promotions: null, error: error.message };
      }
    })
  );
  return (
    <>
      <PageHeading eyebrow="Settings" title="Invoicing, cancellations and offers">
        Every Monday Newdryve works out what each instructor owes you for the week before, from the lessons they completed in
        the app, and emails them an invoice with your bank details. You get a summary of each instructor&rsquo;s week at the
        same time. Below that, set how learners can cancel lessons with your instructors, and an intro offer for new
        learners.
      </PageHeading>
      <BillingSettingsForm data={billing} />
      <CancellationPolicyForm schools={schools} />
      <PromotionsForm schools={offers} />
    </>
  );
}
