import { NextResponse } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { logAudit } from "@/lib/ops/audit";
import { organisationErrorResponse, removeOrganisationMember } from "@/lib/ops/organisations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; instructorId: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Remove an instructor from an organisation. The API notifies the organisation. */
export async function DELETE(_request: Request, context: Params) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id, instructorId } = await context.params;
  if (!UUID.test(id) || !UUID.test(instructorId)) {
    return NextResponse.json({ error: "That instructor is not a member of this organisation." }, { status: 404 });
  }

  try {
    await removeOrganisationMember(id, instructorId, guard.email);
    await logAudit({
      actor_email: guard.email,
      action: "organisation_member_removed",
      target_type: "organisation",
      target_id: id,
      detail: { instructor_id: instructorId },
    }).catch(() => {});
    return NextResponse.json({ removed: true });
  } catch (err) {
    return organisationErrorResponse(err, "Could not remove that instructor.");
  }
}
