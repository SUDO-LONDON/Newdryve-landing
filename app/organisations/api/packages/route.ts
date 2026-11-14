import { orgProxy } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/** POST /v1/organisations/me/packages (ADR-074): add a package the school sells. */
export async function POST(request: Request) {
  return orgProxy(request, "/v1/organisations/me/packages", "POST");
}
