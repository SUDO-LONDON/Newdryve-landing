import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Shell } from "@/components/instructor/Shell";

export const metadata: Metadata = {
  title: "Your Newdryve setup",
  description: "Continue instructor payout and listing setup on Newdryve.",
  robots: { index: false, follow: false },
};

/** Older payout emails used this route; keep their token working in the hub. */
export default async function InstructorConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params.token;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  if (token) redirect(`/instructor/start?token=${encodeURIComponent(token)}`);

  return (
    <Shell eyebrow="Instructor setup" title="Use your private setup link">
      <p className="mt-4 leading-7 text-ink-secondary">
        Open the link from your Newdryve email to connect payouts and finish your listing. If it
        has expired, email <a className="font-semibold underline" href="mailto:support@newdryve.com">support@newdryve.com</a>.
      </p>
    </Shell>
  );
}
