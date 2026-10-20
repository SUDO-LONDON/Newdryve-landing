import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/organisations/PortalShell";
import { OrganisationPortalApiError, loadOrganisationPortal } from "@/lib/organisations/api";
import { assertOrganisationPortalEnv } from "@/lib/organisations/env";
import { getChosenSchool } from "@/lib/organisations/school";
import { safePortalNext } from "@/lib/organisations/scope";
import { getOrganisationAccessToken } from "@/lib/organisations/supabase-server";

export const metadata: Metadata = { title: "Choose a school" };
export const dynamic = "force-dynamic";

/**
 * The school picker. A Newdryve super admin, and an admin of several schools
 * on the pages that work on one at a time, must say which school; the API
 * answers 422 `organisation_required` until they do (#499). The choice is
 * kept for this browser until they change it or sign out.
 */
export default async function ChooseSchoolPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; next?: string }>;
}) {
  assertOrganisationPortalEnv();
  const token = await getOrganisationAccessToken();
  if (!token) redirect("/organisations/login");
  const { reason, next: rawNext } = await searchParams;
  const next = safePortalNext(rawNext);

  let data;
  try {
    data = await loadOrganisationPortal(token);
  } catch (error) {
    if (error instanceof OrganisationPortalApiError && error.status === 401) redirect("/organisations/login");
    if (error instanceof OrganisationPortalApiError && error.status === 403) redirect("/organisations/denied");
    throw error;
  }
  if (!data.organisations.length) redirect("/organisations/denied");
  const current = await getChosenSchool();
  const schools = [...data.organisations].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHeading eyebrow="School" title="Choose a school">
        {reason === "stale"
          ? "The school you were looking at is no longer available to this login. Choose another."
          : reason === "required"
            ? "This page shows one school at a time. Choose the school to open; you can change it from the header at any time."
            : "Choose the school the portal shows. You can change it at any time."}
      </PageHeading>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
        {schools.map((school) => (
          <li key={school.id}>
            <form action="/organisations/api/school" method="post" className="flex flex-wrap items-center justify-between gap-3 p-4">
              <input type="hidden" name="organisation_id" value={school.id} />
              <input type="hidden" name="next" value={next} />
              <div className="min-w-0">
                <p className="font-semibold text-ink">{school.name}</p>
                <p className="mt-0.5 text-xs text-ink-secondary">
                  {school.members.length} instructor{school.members.length === 1 ? "" : "s"}
                  {school.status !== "active" ? ` · ${school.status}` : ""}
                  {school.id === current ? " · open now" : ""}
                </p>
              </div>
              <button className="focus-ring inline-flex min-h-11 items-center rounded-full bg-racing-green px-4 text-sm font-bold text-white">
                Open {school.name}
              </button>
            </form>
          </li>
        ))}
      </ul>
      {reason !== "required" && schools.length > 1 ? (
        <form action="/organisations/api/school" method="post" className="mt-4">
          <input type="hidden" name="next" value={next} />
          <button className="focus-ring inline-flex min-h-11 items-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-ink">
            Show all my schools together
          </button>
        </form>
      ) : null}
    </>
  );
}
