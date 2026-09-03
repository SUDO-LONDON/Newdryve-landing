import { NextResponse } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { logAudit } from "@/lib/ops/audit";
import { regenerateOrganisationCode, updateOrganisation } from "@/lib/ops/organisations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Params) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  try {
    const organisation = await updateOrganisation(id, body ?? {}, guard.email);
    await logAudit({
      actor_email: guard.email,
      action: "organisation_updated",
      target_type: "organisation",
      target_id: id,
      detail: body,
    }).catch(() => {});
    return NextResponse.json({ organisation });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update organisation." },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, context: Params) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const action = body?.action;

  try {
    if (action === "regenerate_code") {
      const organisation = await regenerateOrganisationCode(id, guard.email);
      await logAudit({
        actor_email: guard.email,
        action: "organisation_code_regenerated",
        target_type: "organisation",
        target_id: id,
      }).catch(() => {});
      return NextResponse.json({ organisation });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update organisation." },
      { status: 400 }
    );
  }
}
