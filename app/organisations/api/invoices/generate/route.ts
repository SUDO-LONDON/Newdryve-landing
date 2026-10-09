import { orgProxy } from "@/lib/organisations/portal";

export async function POST(request: Request) {
  return orgProxy(request, "/v1/organisations/me/invoices/generate", "POST");
}
