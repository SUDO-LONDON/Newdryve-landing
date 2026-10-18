import { redirect } from "next/navigation";
import PortalShell from "@/components/organisations/PortalShell";
import { assertOrganisationPortalEnv } from "@/lib/organisations/env";
import { createOrganisationSupabaseServerClient, getOrganisationAccessToken } from "@/lib/organisations/supabase-server";

export const dynamic = "force-dynamic";

/** Every signed-in portal page. The login and denied pages sit outside it. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  assertOrganisationPortalEnv();
  if (!(await getOrganisationAccessToken())) redirect("/organisations/login");
  // The email is for the header only: the session already holds it, and the
  // API checks the token on every page read. getUser() would be one more
  // round trip to Supabase before any tab could render.
  const supabase = await createOrganisationSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return <PortalShell email={session?.user.email ?? null}>{children}</PortalShell>;
}
