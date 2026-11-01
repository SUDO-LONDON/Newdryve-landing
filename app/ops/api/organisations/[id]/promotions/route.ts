import { NextResponse } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { logAudit } from "@/lib/ops/audit";
import { createOrganisationPromotion, listOrganisationPromotions, organisationErrorResponse } from "@/lib/ops/organisations";
import type { PromotionInput } from "@/lib/organisations/promotions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A school's intro offers, as Newdryve sees them (every email that set one). */
export async function GET(_request: Request, context: Params) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Organisation not found." }, { status: 404 });
  try {
    const promotions = await listOrganisationPromotions(id, guard.email);
    return NextResponse.json({ promotions }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return organisationErrorResponse(err, "Could not load the offers.");
  }
}

/**
 * Start an intro offer for a school. The API validates the body (a strict
 * shape: title, hours, price per hour, optional window) and refuses a second
 * active offer with 409 `promotion_already_active`; both come back to the form.
 */
export async function POST(request: Request, context: Params) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Organisation not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Fill in the offer." }, { status: 422 });
  }

  try {
    const promotion = await createOrganisationPromotion(id, body as PromotionInput, guard.email);
    await logAudit({
      actor_email: guard.email,
      action: "organisation_promotion_created",
      target_type: "organisation",
      target_id: id,
      detail: {
        promotion_id: promotion.id,
        title: promotion.title,
        hours: promotion.hours,
        price_per_hour_pence: promotion.price_per_hour_pence,
        starts_at: promotion.starts_at,
        ends_at: promotion.ends_at,
      },
    }).catch(() => {});
    return NextResponse.json({ promotion }, { status: 201 });
  } catch (err) {
    return organisationErrorResponse(err, "Could not start the offer.");
  }
}
