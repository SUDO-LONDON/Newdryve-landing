import type { Metadata } from "next";
import { PageHeading } from "@/components/organisations/PortalShell";
import RequestsView from "@/components/organisations/RequestsView";
import { orgRead } from "@/lib/organisations/portal";
import type { RequestsResponse } from "@/lib/organisations/requests";

export const metadata: Metadata = { title: "Requests" };
export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const data = await orgRead<RequestsResponse>("/v1/organisations/me/requests", { returnTo: "/organisations/requests" });
  return (
    <>
      <PageHeading eyebrow="Lesson requests" title="Requests">
        Learners&apos; requests that come to the office. Open one to see who is free, who will be nearest after their
        previous lesson, and everyone&apos;s day side by side, then book it, ask an instructor to accept it, or decline it.
      </PageHeading>
      <RequestsView data={data} />
    </>
  );
}
