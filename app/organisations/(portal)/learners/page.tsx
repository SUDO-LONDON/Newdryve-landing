import type { Metadata } from "next";
import LearnerSheet from "@/components/organisations/LearnerSheet";
import { PageHeading } from "@/components/organisations/PortalShell";
import { orgRead } from "@/lib/organisations/portal";
import type { LearnersResponse } from "@/lib/organisations/types";

export const metadata: Metadata = { title: "Learners" };
export const dynamic = "force-dynamic";

export default async function LearnersPage() {
  const data = await orgRead<LearnersResponse>("/v1/organisations/me/learners");
  return (
    <>
      <PageHeading eyebrow="Learner attention" title="Learners">
        Every learner&rsquo;s last six months with their instructor, one square a day. Flagged: learners taught three hours or
        more who then had no lesson for two weeks and nothing booked, and learners whose instructor keeps cancelling or
        declining them.
      </PageHeading>
      <LearnerSheet data={data} />
    </>
  );
}
