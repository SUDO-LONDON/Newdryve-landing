import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/** GET/POST /v1/organisations/me/promotions (Promotions): the school's intro offers. */
export async function GET(request: Request) {
  const org = uuidOrNull(new URL(request.url).searchParams.get("organisation_id"));
  return orgProxy(request, `/v1/organisations/me/promotions${org ? `?organisation_id=${org}` : ""}`, "GET");
}

export async function POST(request: Request) {
  return orgProxy(request, "/v1/organisations/me/promotions", "POST");
}
