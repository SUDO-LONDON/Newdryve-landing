import { orgProxy } from "@/lib/organisations/portal";

/** Who decides the school's lesson requests: the school or each instructor (ADR-073). */
export async function PUT(request: Request) {
  return orgProxy(request, "/v1/organisations/me/request-routing", "PUT");
}
