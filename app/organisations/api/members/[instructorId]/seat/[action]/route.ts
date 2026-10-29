import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/**
 * An admin pauses one member's seat for one month, or resumes it early
 * (Newdryve ADR-060). The API answers 409 `seat_already_paused` or
 * `seat_not_paused`, and 404 when they are not a member.
 */
export async function POST(request: Request, { params }: { params: Promise<{ instructorId: string; action: string }> }) {
  const { instructorId: rawId, action } = await params;
  const instructorId = uuidOrNull(rawId);
  if (!instructorId || (action !== "pause" && action !== "resume")) {
    return Response.json({ error: "That instructor could not be found." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  const org = uuidOrNull(new URL(request.url).searchParams.get("organisation_id"));
  return orgProxy(
    request,
    `/v1/organisations/me/members/${instructorId}/seat/${action}${org ? `?organisation_id=${org}` : ""}`,
    "POST"
  );
}
