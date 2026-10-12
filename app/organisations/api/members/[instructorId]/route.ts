import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/**
 * An admin removes an instructor from their organisation. The API ends the
 * membership and notifies the school; 404 when they are not a member.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ instructorId: string }> }) {
  const instructorId = uuidOrNull((await params).instructorId);
  if (!instructorId) {
    return Response.json({ error: "That instructor could not be found." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  const org = uuidOrNull(new URL(request.url).searchParams.get("organisation_id"));
  return orgProxy(
    request,
    `/v1/organisations/me/members/${instructorId}${org ? `?organisation_id=${org}` : ""}`,
    "DELETE"
  );
}
