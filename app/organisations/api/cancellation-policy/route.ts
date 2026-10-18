import { parseCancellationPolicyInput } from "@/lib/organisations/cancellation-policy";
import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

const PATH = "/v1/organisations/me/cancellation-policy";

/**
 * The school's cancellation policy: free cancellation up to `notice_hours`
 * before a lesson, then `late_fee_bps` of the price. An admin of several
 * schools names one with `organisation_id`, as for billing.
 */
export async function GET(request: Request) {
  const org = uuidOrNull(new URL(request.url).searchParams.get("organisation_id"));
  return orgProxy(request, `${PATH}${org ? `?organisation_id=${org}` : ""}`, "GET");
}

/**
 * Set the policy. Only the allowed values are forwarded, rebuilt from the
 * known fields, so a bad body never reaches the API.
 */
export async function PUT(request: Request) {
  const parsed = parseCancellationPolicyInput(await request.json().catch(() => null));
  if (!parsed.ok) {
    return Response.json(
      { error: parsed.error, code: "validation_failed" },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }
  return orgProxy(request, PATH, "PUT", JSON.stringify(parsed.input));
}
