import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/** PATCH /v1/organisations/me/packages/:id: change one of the school's packages, or take it off sale. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = uuidOrNull((await params).id);
  if (!id) {
    return Response.json({ error: "That package could not be found." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  return orgProxy(request, `/v1/organisations/me/packages/${id}`, "PATCH");
}
