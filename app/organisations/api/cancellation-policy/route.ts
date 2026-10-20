import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/** GET/PUT /v1/organisations/me/cancellation-policy (ADR-044). */
export async function GET(request: Request) {
  const org = uuidOrNull(new URL(request.url).searchParams.get("organisation_id"));
  return orgProxy(request, `/v1/organisations/me/cancellation-policy${org ? `?organisation_id=${org}` : ""}`, "GET");
}

export async function PUT(request: Request) {
  return orgProxy(request, "/v1/organisations/me/cancellation-policy", "PUT");
}
