import { NextResponse } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { logAudit } from "@/lib/ops/audit";
import { createOrganisationAdmin, organisationErrorResponse } from "@/lib/ops/organisations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Params) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  try {
    const result = await createOrganisationAdmin(id, body ?? {}, guard.email);
    await logAudit({
      actor_email: guard.email,
      action: "organisation_admin_created",
      target_type: "organisation",
      target_id: id,
      detail: {
        email: typeof body?.email === "string" ? body.email.trim().toLowerCase() : null,
        existing_login: result.existing_login,
      },
    }).catch(() => {});
    return NextResponse.json({ ok: true, existing_login: result.existing_login }, { status: 201 });
  } catch (err) {
    // The API's status and code (password_required, email_in_use) reach the
    // form, which words them.
    return organisationErrorResponse(err, "Could not create organisation admin.");
  }
}
