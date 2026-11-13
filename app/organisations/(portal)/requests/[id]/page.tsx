import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/organisations/PortalShell";
import RequestDesk from "@/components/organisations/RequestDesk";
import { OrganisationPortalApiError } from "@/lib/organisations/api";
import { orgRead } from "@/lib/organisations/portal";
import type { RequestDetailResponse } from "@/lib/organisations/requests";

export const metadata: Metadata = { title: "Request" };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data: RequestDetailResponse | null = null;
  if (UUID.test(id)) {
    try {
      data = await orgRead<RequestDetailResponse>(`/v1/organisations/me/requests/${id}`, { returnTo: `/organisations/requests/${id}` });
    } catch (err) {
      // Booked, sent, declined or cancelled since the list was read.
      if (!(err instanceof OrganisationPortalApiError) || (err.status !== 404 && err.status !== 409)) throw err;
    }
  }
  if (!data) {
    return (
      <>
        <PageHeading eyebrow="Lesson request" title="Already dealt with" />
        <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-ink-secondary">
          <p>This request has been booked, sent, declined or cancelled since you opened it.</p>
          <Link href="/organisations/requests" className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-full bg-racing-green px-5 text-sm font-bold text-white">
            Back to requests
          </Link>
        </div>
      </>
    );
  }
  return (
    <>
      <PageHeading eyebrow="Lesson request" title="Choose an instructor" />
      <RequestDesk data={data} />
    </>
  );
}
