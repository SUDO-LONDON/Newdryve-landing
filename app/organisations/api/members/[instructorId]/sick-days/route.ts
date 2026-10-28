import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/**
 * A member's sick days (Newdryve ADR-058). GET lists them from today, each
 * with who gave it; POST `{ date }` gives one for any day from today. The API
 * checks the instructor is an active member of the admin's school (403
 * otherwise) and refuses a past day (422 `date_out_of_range`).
 */
async function proxy(request: Request, params: Promise<{ instructorId: string }>, method: "GET" | "POST") {
  const instructorId = uuidOrNull((await params).instructorId);
  if (!instructorId) {
    return Response.json({ error: "That instructor could not be found." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  const org = uuidOrNull(new URL(request.url).searchParams.get("organisation_id"));
  return orgProxy(
    request,
    `/v1/organisations/instructors/${instructorId}/sick-days${org ? `?organisation_id=${org}` : ""}`,
    method
  );
}

export async function GET(request: Request, { params }: { params: Promise<{ instructorId: string }> }) {
  return proxy(request, params, "GET");
}

export async function POST(request: Request, { params }: { params: Promise<{ instructorId: string }> }) {
  return proxy(request, params, "POST");
}
