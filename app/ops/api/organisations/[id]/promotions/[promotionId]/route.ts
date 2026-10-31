import { NextResponse } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { logAudit } from "@/lib/ops/audit";
import { organisationErrorResponse, updateOrganisationPromotion } from "@/lib/ops/organisations";
import type { PromotionInput } from "@/lib/organisations/promotions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; promotionId: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Change a school's offer, or end it (`active: false`). Nothing is ever deleted. */
export async function PATCH(request: Request, context: Params) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id, promotionId } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Organisation not found." }, { status: 404 });
  if (!UUID.test(promotionId)) return NextResponse.json({ error: "Offer not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Nothing to change." }, { status: 422 });
  }

  try {
    const promotion = await updateOrganisationPromotion(id, promotionId, body as Partial<PromotionInput>, guard.email);
    await logAudit({
      actor_email: guard.email,
      action: "organisation_promotion_updated",
      target_type: "organisation",
      target_id: id,
      detail: { promotion_id: promotionId, fields: Object.keys(body as Record<string, unknown>), active: promotion.active },
    }).catch(() => {});
    return NextResponse.json({ promotion });
  } catch (err) {
    return organisationErrorResponse(err, "Could not save the offer.");
  }
}
