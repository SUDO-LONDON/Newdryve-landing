import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/** Mark one notification read, for this admin login only. Idempotent. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = uuidOrNull((await params).id);
  if (!id) {
    return Response.json({ error: "Notification not found." }, { status: 404, headers: { "cache-control": "no-store" } });
  }
  return orgProxy(request, `/v1/organisations/me/notifications/${id}/read`, "POST");
}
