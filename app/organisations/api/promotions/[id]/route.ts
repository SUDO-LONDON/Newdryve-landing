import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/** PATCH /v1/organisations/me/promotions/:id: change or end one of the school's offers. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = uuidOrNull((await params).id);
  if (!id) {
    return Response.json({ error: "That offer could not be found." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  return orgProxy(request, `/v1/organisations/me/promotions/${id}`, "PATCH");
}
