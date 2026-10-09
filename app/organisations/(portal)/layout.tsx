import { redirect } from "next/navigation";
import PortalShell from "@/components/organisations/PortalShell";
import { assertOrganisationPortalEnv } from "@/lib/organisations/env";
import { createOrganisationSupabaseServerClient, getOrganisationAccessToken } from "@/lib/organisations/supabase-server";

export const dynamic = "force-dynamic";

/** Every signed-in portal page. The login and denied pages sit outside it. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  assertOrganisationPortalEnv();
  if (!(await getOrganisationAccessToken())) redirect("/organisations/login");
  const supabase = await createOrganisationSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <PortalShell email={user?.email ?? null}>{children}</PortalShell>;
}
