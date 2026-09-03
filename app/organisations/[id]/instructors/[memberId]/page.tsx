import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPence } from "@/lib/ops/types";
import { getOrganisation } from "@/lib/ops/organisations";
import { getSessionEmail } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OrganisationInstructorPage({
  params,
}: {
  params: Promise<{ id: string; memberId: string }>;
}) {
  const { id, memberId } = await params;
  const email = (await getSessionEmail()) || "";
  const organisation = await getOrganisation(id, email);
  if (!organisation) notFound();
  const member = organisation.members.find((item) => item.id === memberId);
  if (!member) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/organisations/${organisation.id}`} className="text-sm text-racing-green hover:underline">
          &lt;- {organisation.name}
        </Link>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-racing-green">
          Instructor
        </p>
        <h1 className="mt-1 font-display text-2xl text-ink">{member.display_name}</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {member.email || "No email"} · {member.status}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Current lesson" value={presenceLabel(member.lesson_presence)} />
        <StatTile label="Revenue" value={formatPence(member.revenue_pence)} />
        <StatTile label="Lessons" value={String(member.lesson_count)} />
        <StatTile label="Linked" value={formatDate(member.linked_at)} />
      </div>

      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="font-display text-lg text-ink">Individual view</h2>
        <dl className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Organisation" value={organisation.name} />
          <Field label="Instructor id" value={member.instructor_id} />
          <Field label="Profile id" value={member.profile_id || "Not synced"} />
          <Field label="Phone" value={member.phone || "Not set"} />
          <Field label="Active lesson" value={member.active_lesson_label || "None reported"} />
          <Field label="Last seen" value={formatDateTime(member.last_seen_at)} />
        </dl>
      </section>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-xl text-ink">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm text-ink">{value}</dd>
    </div>
  );
}

function presenceLabel(value: string): string {
  if (value === "in_lesson") return "In lesson";
  if (value === "available") return "Available";
  if (value === "offline") return "Offline";
  return "Unknown";
}

function formatDate(value: string | null): string {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not synced";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
