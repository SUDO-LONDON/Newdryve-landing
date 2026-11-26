import type { Metadata } from "next";
import { PageHeading } from "@/components/organisations/PortalShell";
import TestResultsView from "@/components/organisations/TestResultsView";
import { orgRead } from "@/lib/organisations/portal";
import type { TestResultsResponse } from "@/lib/organisations/types";

export const metadata: Metadata = { title: "Test results" };
export const dynamic = "force-dynamic";

export default async function TestResultsPage() {
  const data = await orgRead<TestResultsResponse>("/v1/organisations/me/test-results", { returnTo: "/organisations/test-results" });
  return (
    <>
      <PageHeading eyebrow="Driving tests" title="Test results">
        Practical tests your instructors recorded from WhatsApp: the learner, majors, minors and the examiner. A pass is
        no majors and 15 minors or fewer.
      </PageHeading>
      <TestResultsView data={data} />
    </>
  );
}
