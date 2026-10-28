import { NextResponse } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { logAudit } from "@/lib/ops/audit";
import { organisationErrorResponse, revokeOrganisationAdmin } from "@/lib/ops/organisations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; adminId: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Revoke a school admin login's access to this school. The API ends it on the
 * login's next request; its other schools keep theirs.
 */
export async function DELETE(_request: Request, context: Params) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id, adminId } = await context.params;
  if (!UUID.test(id) || !UUID.test(adminId)) {
    return NextResponse.json({ error: "That admin login is not linked to this organisation." }, { status: 404 });
  }

  try {
    const result = await revokeOrganisationAdmin(id, adminId, guard.email);
    if (!result.already_revoked) {
      await logAudit({
        actor_email: guard.email,
        action: "organisation_admin_revoked",
        target_type: "organisation",
        target_id: id,
        detail: { admin_id: adminId },
      }).catch(() => {});
    }
    return NextResponse.json({ revoked: true, ...result });
  } catch (err) {
    return organisationErrorResponse(err, "Could not revoke that admin login.");
  }
}
