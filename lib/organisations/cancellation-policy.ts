/**
 * A school's cancellation policy (ADR-044), checked the way the API checks it
 * (backend `cancellationPolicyFields`: notice from CANCEL_NOTICE_HOURS, late
 * fee from LATE_CANCEL_FEE_BPS), so a bad value is caught before the round
 * trip. Client-safe.
 *
 *   GET /v1/organisations/me/cancellation-policy?organisation_id=
 *   PUT /v1/organisations/me/cancellation-policy { organisation_id, notice_hours, late_fee_bps }
 */

export const CANCEL_NOTICE_HOURS = [2, 6, 12, 24, 48, 72] as const;
export const LATE_CANCEL_FEE_BPS = [0, 5000, 10000] as const;

export interface CancellationPolicy {
  notice_hours: number;
  late_fee_bps: number;
}

export interface CancellationPolicyResponse {
  cancellation_policy: CancellationPolicy;
  /** False once the school is cancelled: members' own policies apply then. */
  applied: boolean;
}

/** The form's values, as the selects hold them. */
export interface CancellationPolicyDraft {
  notice_hours: string;
  late_fee_bps: string;
}

export function draftFromPolicy(policy: CancellationPolicy): CancellationPolicyDraft {
  return { notice_hours: String(policy.notice_hours), late_fee_bps: String(policy.late_fee_bps) };
}

export function policyInputFromDraft(
  organisationId: string,
  draft: CancellationPolicyDraft
): { ok: true; input: CancellationPolicy & { organisation_id: string } } | { ok: false; error: string } {
  const notice = Number(draft.notice_hours);
  const fee = Number(draft.late_fee_bps);
  if (!Number.isInteger(notice) || !(CANCEL_NOTICE_HOURS as readonly number[]).includes(notice)) {
    return { ok: false, error: `Choose a notice period of ${CANCEL_NOTICE_HOURS.join(", ")} hours.` };
  }
  if (!Number.isInteger(fee) || !(LATE_CANCEL_FEE_BPS as readonly number[]).includes(fee)) {
    return { ok: false, error: "Choose a late fee of none, half or the full lesson price." };
  }
  return { ok: true, input: { organisation_id: organisationId, notice_hours: notice, late_fee_bps: fee } };
}

export function noticeLabel(hours: number): string {
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

export function lateFeeLabel(bps: number): string {
  if (bps === 0) return "No fee";
  if (bps === 10000) return "Full lesson price";
  if (bps === 5000) return "Half the lesson price";
  return `${bps / 100}% of the lesson price`;
}

/** "A learner who cancels with less than 24 hours' notice pays half the lesson price." */
export function describePolicy(policy: CancellationPolicy): string {
  const notice = noticeLabel(policy.notice_hours);
  if (policy.late_fee_bps === 0) {
    return `A learner who cancels with less than ${notice}' notice pays nothing.`;
  }
  return `A learner who cancels with less than ${notice}' notice pays ${lateFeeLabel(policy.late_fee_bps).toLowerCase()}.`;
}
