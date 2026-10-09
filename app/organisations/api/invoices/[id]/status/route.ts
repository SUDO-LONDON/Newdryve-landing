import { orgProxy } from "@/lib/organisations/portal";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return orgProxy(request, `/v1/organisations/me/invoices/${encodeURIComponent(id)}/status`, "POST");
}
