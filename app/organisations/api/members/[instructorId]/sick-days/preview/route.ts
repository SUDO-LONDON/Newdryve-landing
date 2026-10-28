import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";
import { isCalendarDate } from "@/lib/organisations/sick-days";

export const dynamic = "force-dynamic";

/** What giving a member a sick day on `?date=` would cancel, before the school confirms. */
export async function GET(request: Request, { params }: { params: Promise<{ instructorId: string }> }) {
  const instructorId = uuidOrNull((await params).instructorId);
  const query = new URL(request.url).searchParams;
  const date = query.get("date");
  if (!instructorId) {
    return Response.json({ error: "That instructor could not be found." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  if (!isCalendarDate(date)) {
    return Response.json({ error: "Choose a date.", code: "invalid_date" }, { status: 422, headers: { "cache-control": "no-store" } });
  }
  const org = uuidOrNull(query.get("organisation_id"));
  return orgProxy(
    request,
    `/v1/organisations/instructors/${instructorId}/sick-days/preview?date=${date}${org ? `&organisation_id=${org}` : ""}`,
    "GET"
  );
}
