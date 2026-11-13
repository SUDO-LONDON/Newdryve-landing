import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/**
 * An admin unbans an instructor their school removed, so the instructor can
 * rejoin with the school code; `send_invite` also emails them. 404 when this
 * school has no ban on them.
 */
export async function POST(request: Request, { params }: { params: Promise<{ instructorId: string }> }) {
  const instructorId = uuidOrNull((await params).instructorId);
  if (!instructorId) {
    return Response.json({ error: "That instructor could not be found." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  return orgProxy(request, `/v1/organisations/me/removed-members/${instructorId}/reinvite`, "POST");
}
