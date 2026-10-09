import type { Metadata } from "next";
import BillingSettingsForm from "@/components/organisations/BillingSettingsForm";
import { PageHeading } from "@/components/organisations/PortalShell";
import { orgRead } from "@/lib/organisations/portal";
import type { BillingResponse } from "@/lib/organisations/types";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const billing = await orgRead<BillingResponse>("/v1/organisations/me/billing");
  return (
    <>
      <PageHeading eyebrow="Settings" title="Invoicing your instructors">
        Every Monday Newdryve works out what each instructor owes you for the week before, from the lessons they completed in
        the app, and emails them an invoice with your bank details. You get a summary of each instructor&rsquo;s week at the
        same time.
      </PageHeading>
      <BillingSettingsForm data={billing} />
    </>
  );
}
