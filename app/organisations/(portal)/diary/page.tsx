import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/organisations/PortalShell";
import SchoolDayBoard from "@/components/organisations/SchoolDayBoard";
import { addDays, day, londonToday } from "@/lib/organisations/format";
import { orgRead } from "@/lib/organisations/portal";
import type { SchoolDay } from "@/lib/organisations/requests";

export const metadata: Metadata = { title: "Diary" };
export const dynamic = "force-dynamic";

export default async function DiaryPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: requested } = await searchParams;
  const date = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : londonToday();
  const data = await orgRead<SchoolDay>(`/v1/organisations/me/calendar?date=${date}`, { returnTo: `/organisations/diary?date=${date}` });
  const link = "focus-ring inline-flex min-h-11 items-center rounded-lg border border-border bg-white px-3 text-sm font-semibold text-ink hover:bg-blush-surface";
  return (
    <>
      <PageHeading eyebrow="All instructors" title="Diary">
        Every instructor&apos;s day on one timeline. Their own private learners show as &quot;Private lesson&quot; with no
        name.
      </PageHeading>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={`/organisations/diary?date=${addDays(date, -1)}`} className={link} aria-label="Previous day">
          ←
        </Link>
        <p className="min-w-40 text-center font-display text-xl text-ink">{day(date)}</p>
        <Link href={`/organisations/diary?date=${addDays(date, 1)}`} className={link} aria-label="Next day">
          →
        </Link>
        {date !== londonToday() ? (
          <Link href="/organisations/diary" className={link}>
            Today
          </Link>
        ) : null}
      </div>
      <SchoolDayBoard day={data} />
    </>
  );
}
