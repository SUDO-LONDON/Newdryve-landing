import type { Metadata } from "next";
import BillingSettingsForm from "@/components/organisations/BillingSettingsForm";
import CancellationPolicyForm from "@/components/organisations/CancellationPolicyForm";
import { PageHeading } from "@/components/organisations/PortalShell";
import { cancellationPolicyLoad } from "@/lib/organisations/cancellation-policy";
import { orgRead, orgReadSection } from "@/lib/organisations/portal";
import type { BillingResponse } from "@/lib/organisations/types";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const billing = await orgRead<BillingResponse>("/v1/organisations/me/billing");
  // One policy per school. Read per section, so an API that does not have the
  // endpoint yet (404) shows a note there instead of failing the whole page.
  const policies = await Promise.all(
    billing.organisations.map(async (org) => ({
      id: org.id,
      name: org.name,
      load: cancellationPolicyLoad(
        await orgReadSection(`/v1/organisations/me/cancellation-policy?organisation_id=${encodeURIComponent(org.id)}`)
      ),
    }))
  );
  return (
    <>
      <PageHeading eyebrow="Settings" title="Invoicing your instructors">
        Every Monday Newdryve works out what each instructor owes you for the week before, from the lessons they completed in
        the app, and emails them an invoice with your bank details. You get a summary of each instructor&rsquo;s week at the
        same time.
      </PageHeading>
      <BillingSettingsForm data={billing} />

      <section aria-labelledby="cancellation-policy-title" className="mt-10 border-t border-border pt-8">
        <h2 id="cancellation-policy-title" className="font-display text-3xl text-ink">
          Cancellation policy
        </h2>
        <div className="mb-6 mt-2 max-w-3xl space-y-2 text-sm leading-6 text-ink-secondary">
          <p>
            How long before a lesson your learners can cancel for free, and what they pay if they cancel after that. It
            applies to every instructor in your school.
          </p>
          <p>
            A change only applies to lessons booked after you make it. Lessons already booked keep the policy they were
            booked with.
          </p>
        </div>
        <CancellationPolicyForm organisations={policies} />
      </section>
    </>
  );
}
