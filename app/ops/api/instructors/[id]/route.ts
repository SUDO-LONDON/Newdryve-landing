import { NextResponse } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { logAudit } from "@/lib/ops/audit";
import {
  approveInstructor,
  InstructorApiError,
  reinstateInstructor,
  rejectInstructor,
  resendInstructorActivation,
  updateInstructorBilling,
  updateInstructorVerification,
} from "@/lib/ops/instructors";

// Approve / reject / reinstate an instructor application.
//
// The decision is made here, inside the authenticated portal — never from a
// link in an email. requireFounder() re-verifies the session server-side even
// though middleware already gated /ops, and the live API independently
// re-checks the acting founder against its own allowlist.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "approve" | "reject" | "reinstate" | "update_billing" | "update_verification" | "resend_activation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid instructor id" }, { status: 400 });
  }

  let body: {
    action?: Action;
    reason?: string;
    adi_verified?: boolean;
    adi_badge_expires_on?: string;
    dvsa_verification_consent_confirmed?: boolean;
    adi_verification_method?: "govuk_directory" | "dvsa_contact";
    adi_verification_note?: string | null;
    is_listed?: boolean;
    monthly_amount_pence?: number;
    trial_months?: number;
    trial_source?: "word_of_mouth" | "referral" | "other" | null;
    trial_note?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const action = body.action;
  if (action !== "approve" && action !== "reject" && action !== "reinstate" && action !== "update_billing" && action !== "update_verification" && action !== "resend_activation") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    if (action === "approve") {
      await approveInstructor(guard.email, id, {
        adi_verified: body.adi_verified === true,
        adi_badge_expires_on: String(body.adi_badge_expires_on || ""),
        dvsa_verification_consent_confirmed: body.dvsa_verification_consent_confirmed === true,
        adi_verification_method: body.adi_verification_method as "govuk_directory" | "dvsa_contact",
        adi_verification_note:
          typeof body.adi_verification_note === "string"
            ? body.adi_verification_note.trim().slice(0, 500) || null
            : null,
        is_listed: body.is_listed === true,
        monthly_amount_pence: Number(body.monthly_amount_pence),
        trial_months: Number(body.trial_months || 0),
        trial_source: body.trial_source || null,
        trial_note: typeof body.trial_note === "string" ? body.trial_note.trim().slice(0, 500) || null : null,
      });
    } else if (action === "reject") {
      const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
      await rejectInstructor(guard.email, id, reason || null);
    } else if (action === "reinstate") {
      await reinstateInstructor(guard.email, id);
    } else if (action === "update_billing") {
      await updateInstructorBilling(guard.email, id, Number(body.monthly_amount_pence));
    } else if (action === "update_verification") {
      await updateInstructorVerification(guard.email, id, {
        adi_verified: true,
        adi_badge_expires_on: String(body.adi_badge_expires_on || ""),
        dvsa_verification_consent_confirmed: body.dvsa_verification_consent_confirmed === true,
        adi_verification_method: body.adi_verification_method as "govuk_directory" | "dvsa_contact",
        adi_verification_note:
          typeof body.adi_verification_note === "string"
            ? body.adi_verification_note.trim().slice(0, 500) || null
            : null,
      });
    } else {
      await resendInstructorActivation(guard.email, id);
    }
  } catch (err) {
    if (err instanceof InstructorApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[ops/instructors] action failed", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }

  // Approving or rejecting a named individual is a decision worth a permanent
  // record on this side too, independent of the API's own audit columns.
  await logAudit({
    actor_email: guard.email,
    action: `instructor_${action}`,
    target_type: "instructor",
    target_id: id,
    detail:
      action === "approve"
        ? {
            adi_verified: body.adi_verified === true,
            adi_badge_expires_on: body.adi_badge_expires_on,
            dvsa_verification_consent_confirmed: body.dvsa_verification_consent_confirmed === true,
            adi_verification_method: body.adi_verification_method,
            adi_verification_note: body.adi_verification_note,
            is_listed: body.is_listed === true,
            monthly_amount_pence: body.monthly_amount_pence,
            trial_months: body.trial_months,
            trial_source: body.trial_source,
            trial_note: body.trial_note,
          }
        : action === "reject"
          ? { reason: body.reason ?? null }
          : action === "update_billing"
            ? { monthly_amount_pence: body.monthly_amount_pence }
            : action === "update_verification"
              ? {
                  adi_badge_expires_on: body.adi_badge_expires_on,
                  adi_verification_method: body.adi_verification_method,
                  adi_verification_note: body.adi_verification_note,
                }
            : action === "resend_activation"
              ? { email_resent: true }
              : undefined,
  }).catch((err) => {
    // The decision already landed upstream; a failed audit write must not
    // report the action as failed.
    console.error("[ops/instructors] audit write failed", err);
  });

  return NextResponse.json({ ok: true });
}
