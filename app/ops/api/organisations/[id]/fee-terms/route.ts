import { NextResponse } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { logAudit } from "@/lib/ops/audit";
import { organisationErrorResponse, setOrganisationFeeTerms } from "@/lib/ops/organisations";
import { CURRENT_FEE_MODES } from "@/lib/organisations/fees";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Set what an organisation charges its instructors. Only Newdryve does this;
 * the school portal shows the terms read-only. The API is the validator (one
 * of the current modes, exactly the field it needs); its 422 details, including
 * `allowed_modes`, are passed back to the form.
 */
export async function PUT(request: Request, context: Params) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Organisation not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Choose the fee terms.", details: { allowed_modes: CURRENT_FEE_MODES } },
      { status: 422 }
    );
  }

  try {
    const feeTerms = await setOrganisationFeeTerms(id, body, guard.email);
    await logAudit({
      actor_email: guard.email,
      action: "organisation_fee_terms_set",
      target_type: "organisation",
      target_id: id,
      detail: { fee_mode: feeTerms.fee_mode, amount_pence: feeTerms.amount_pence, percent_bps: feeTerms.percent_bps, rate_card: feeTerms.rate_card ?? null },
    }).catch(() => {});
    return NextResponse.json({ fee_terms: feeTerms });
  } catch (err) {
    return organisationErrorResponse(err, "Could not save the fee terms.");
  }
}
