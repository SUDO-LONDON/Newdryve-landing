import { NextResponse } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { logAudit } from "@/lib/ops/audit";
import { createOrganisation } from "@/lib/ops/organisations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const organisation = await createOrganisation(body, guard.email);
    await logAudit({
      actor_email: guard.email,
      action: "organisation_created",
      target_type: "organisation",
      target_id: organisation.id,
      detail: { name: organisation.name },
    }).catch(() => {});
    return NextResponse.json({ organisation });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create organisation." },
      { status: 400 }
    );
  }
}
