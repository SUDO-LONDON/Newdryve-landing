import type { Metadata } from "next";
import LearnerHoursPanel from "@/components/organisations/LearnerHoursPanel";
import PackagesPanel from "@/components/organisations/PackagesPanel";
import { PageHeading } from "@/components/organisations/PortalShell";
import { orgRead } from "@/lib/organisations/portal";
import type { LearnerHoursResponse, PackagesResponse } from "@/lib/organisations/packages";

export const metadata: Metadata = { title: "Packages" };
export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const returnTo = "/organisations/packages";
  // One after the other: the first settles sign-in and which school before the second is asked.
  const list = await orgRead<PackagesResponse>("/v1/organisations/me/packages", { returnTo });
  const hours = await orgRead<LearnerHoursResponse>("/v1/organisations/me/learner-packages", { returnTo });
  return (
    <>
      <PageHeading eyebrow="Paid up front" title="Packages">
        The packages of lessons you sell and take payment for yourself. When your office books a caller from WhatsApp it
        says which one they paid for; their lessons then come out of those hours, with no card, and they see what they
        have left with you in the Newdryve app.
      </PageHeading>
      <div className="space-y-6">
        <PackagesPanel organisationId={list.organisation_id} packages={list.packages ?? []} />
        <LearnerHoursPanel organisationId={hours.organisation_id} items={hours.items ?? []} />
      </div>
    </>
  );
}
