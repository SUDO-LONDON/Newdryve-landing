import { orgProxy } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/** Polled by the live board. */
export async function GET(request: Request) {
  const org = new URL(request.url).searchParams.get("organisation_id");
  return orgProxy(request, `/v1/organisations/me/live${org ? `?organisation_id=${encodeURIComponent(org)}` : ""}`, "GET");
}
