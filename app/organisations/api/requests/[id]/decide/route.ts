import { NextResponse } from "next/server";
import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";

/** Book, send or decline a request the school holds (ADR-073). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = uuidOrNull((await params).id);
  if (!id) return NextResponse.json({ error: "Unknown request" }, { status: 404 });
  return orgProxy(request, `/v1/organisations/me/requests/${id}/decide`, "POST");
}
