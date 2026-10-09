import type { Metadata } from "next";
import LiveBoard from "@/components/organisations/LiveBoard";
import { PageHeading } from "@/components/organisations/PortalShell";
import { orgRead } from "@/lib/organisations/portal";
import type { LiveResponse } from "@/lib/organisations/types";

export const metadata: Metadata = { title: "Live" };
export const dynamic = "force-dynamic";

export default async function LivePage() {
  const live = await orgRead<LiveResponse>("/v1/organisations/me/live");
  return (
    <>
      <PageHeading eyebrow="Right now" title="Instructors">
        What each instructor is doing and when they are next free. The bar shows today: working hours in white, lessons in
        green, blocked time striped, and now in pink.
      </PageHeading>
      <LiveBoard initial={live} />
    </>
  );
}
