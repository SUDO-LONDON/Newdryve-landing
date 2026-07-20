import { redirect } from "next/navigation";
import NavShell from "@/components/ops/NavShell";
import { getSessionEmail } from "@/lib/supabase/server";
import { isFounderEmail } from "@/lib/ops/env";

// Authenticated portal chrome. Middleware already gates access; this re-checks
// server-side (defence in depth) before rendering any founder data.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const email = await getSessionEmail();
  if (!email) redirect("/ops/login");
  if (!isFounderEmail(email)) redirect("/ops/denied");

  return <NavShell email={email}>{children}</NavShell>;
}
