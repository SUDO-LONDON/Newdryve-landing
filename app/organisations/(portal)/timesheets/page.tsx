import type { Metadata } from "next";
import { PageHeading } from "@/components/organisations/PortalShell";
import TimesheetView from "@/components/organisations/TimesheetView";
import { orgRead } from "@/lib/organisations/portal";
import type { TimesheetResponse } from "@/lib/organisations/types";

export const metadata: Metadata = { title: "Timesheets" };
export const dynamic = "force-dynamic";

export default async function TimesheetsPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  const valid = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : null;
  const data = await orgRead<TimesheetResponse>(`/v1/organisations/me/timesheet${valid ? `?week=${valid}` : ""}`);
  return (
    <>
      <PageHeading eyebrow="Hours" title="Timesheets">
        Hours each instructor taught, day by day, with their clocked time and takings.
      </PageHeading>
      <TimesheetView data={data} />
    </>
  );
}
