import { redirect } from "next/navigation";
import InstructorApprovals from "@/components/ops/InstructorApprovals";
import { logAudit } from "@/lib/ops/audit";
import { getSessionEmail } from "@/lib/supabase/server";
import { isFounderEmail } from "@/lib/ops/env";
import {
  InstructorApiError,
  isInstructorApiConfigured,
  listInstructorApplications,
  type ApplicationStatus,
  type InstructorApplication,
} from "@/lib/ops/instructors";

export const dynamic = "force-dynamic";

const TABS: { value: ApplicationStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default async function InstructorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const email = await getSessionEmail();
  if (!email) redirect("/ops/login");
  if (!isFounderEmail(email)) redirect("/ops/denied");

  const { status: statusParam } = await searchParams;
  const status: ApplicationStatus =
    statusParam === "active" || statusParam === "rejected" ? statusParam : "pending";

  let applications: InstructorApplication[] = [];
  let error: string | null = null;

  if (!isInstructorApiConfigured()) {
    error =
      "Instructor approvals are not configured yet. Set NEWDRYVE_API_ORIGIN and NEWDRYVE_API_OPS_SECRET on this service.";
  } else {
    try {
      applications = await listInstructorApplications(email, status);
      // Listing an application exposes an applicant's name, email, phone and
      // certificates. That is a personal-data access and is recorded as one.
      if (applications.length > 0) {
        await logAudit({
          actor_email: email,
          action: "view_personal_data",
          target_type: "instructor_applications",
          detail: { status, count: applications.length },
        }).catch(() => {});
      }
    } catch (err) {
      error =
        err instanceof InstructorApiError
          ? err.message
          : "Could not load instructor applications.";
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-racing-green">
          Supply
        </p>
        <h1 className="font-display text-2xl text-ink">Pending Instructor Approvals</h1>
        <p className="max-w-2xl text-sm text-ink-secondary">
          Instructors apply at{" "}
          <span className="font-medium text-ink">newdryve.com/instructors/apply</span> and land here
          before they can sign in. Approving one activates the password they chose when they
          applied and emails them to say they&rsquo;re in.
        </p>
      </header>

      <nav className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <a
            key={tab.value}
            href={`/ops/instructors?status=${tab.value}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
              status === tab.value
                ? "border-racing-green font-semibold text-ink"
                : "border-transparent text-ink-secondary hover:text-ink"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      {error ? (
        <div className="rounded-xl border border-border bg-blush-surface p-5 text-sm text-ink-secondary">
          {error}
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-sm text-ink-secondary">
            {status === "pending"
              ? "No applications waiting. New ones appear here as soon as they come in."
              : status === "active"
                ? "No approved instructors yet."
                : "Nothing rejected."}
          </p>
        </div>
      ) : (
        <InstructorApprovals applications={applications} status={status} />
      )}
    </div>
  );
}
