import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/** PATCH /v1/organisations/me/learner-packages/:id: correct a learner's hours, or cancel their package. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = uuidOrNull((await params).id);
  if (!id) {
    return Response.json({ error: "That package could not be found." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  return orgProxy(request, `/v1/organisations/me/learner-packages/${id}`, "PATCH");
}
