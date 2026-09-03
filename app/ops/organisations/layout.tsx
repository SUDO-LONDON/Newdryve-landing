import type { Metadata } from "next";
import { redirect } from "next/navigation";
import NavShell from "@/components/ops/NavShell";
import { isFounderEmail } from "@/lib/ops/env";
import { getSessionEmail } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Organisations",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default async function OrganisationsLayout({ children }: { children: React.ReactNode }) {
  const email = await getSessionEmail();
  if (!email) redirect("/ops/login?next=/ops/organisations");
  if (!isFounderEmail(email)) redirect("/ops/denied");

  return (
    <div className="min-h-full bg-canvas text-ink">
      <NavShell email={email}>{children}</NavShell>
    </div>
  );
}
