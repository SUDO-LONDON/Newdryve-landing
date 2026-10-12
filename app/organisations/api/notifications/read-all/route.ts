import { orgProxy } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/** Mark every notification read, for this admin login. Body: `{ organisation_id? }`. */
export async function POST(request: Request) {
  return orgProxy(request, "/v1/organisations/me/notifications/read-all", "POST");
}
