import { orgProxy } from "@/lib/organisations/portal";

export async function PUT(request: Request) {
  return orgProxy(request, "/v1/organisations/me/billing", "PUT");
}
