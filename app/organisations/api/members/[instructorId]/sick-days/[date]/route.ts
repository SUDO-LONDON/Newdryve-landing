import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";
import { isCalendarDate } from "@/lib/organisations/sick-days";

export const dynamic = "force-dynamic";

/**
 * The school removes a sick day it gave a member: the day reopens to bookings;
 * lessons it cancelled stay cancelled. A day the instructor called in
 * themselves is theirs to reopen (409 `not_given_by_school`).
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ instructorId: string; date: string }> }) {
  const { instructorId: rawId, date } = await params;
  const instructorId = uuidOrNull(rawId);
  if (!instructorId || !isCalendarDate(date)) {
    return Response.json({ error: "That sick day could not be found." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  const org = uuidOrNull(new URL(request.url).searchParams.get("organisation_id"));
  return orgProxy(
    request,
    `/v1/organisations/instructors/${instructorId}/sick-days/${date}${org ? `?organisation_id=${org}` : ""}`,
    "DELETE"
  );
}
