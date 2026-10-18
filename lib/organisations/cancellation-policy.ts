/**
 * A school's cancellation policy, as GET/PUT
 * /v1/organisations/me/cancellation-policy describes it: how long before a
 * lesson a learner can cancel for free, and what they pay if they cancel after
 * that. It applies to every instructor in the school, and the API snapshots it
 * onto each booking when the booking is made, so a change only reaches lessons
 * booked afterwards.
 *
 * Client-safe: no server imports, so the portal route and the settings form
 * both use it.
 */

/** Free cancellation up to this many hours before the start. */
export const NOTICE_HOURS_OPTIONS = [2, 6, 12, 24, 48, 72] as const;
export type NoticeHours = (typeof NOTICE_HOURS_OPTIONS)[number];

/** The late fee, as basis points of the booked price: none, half, full. */
export const LATE_FEE_BPS_OPTIONS = [0, 5000, 10000] as const;
export type LateFeeBps = (typeof LATE_FEE_BPS_OPTIONS)[number];

export interface CancellationPolicy {
  notice_hours: NoticeHours;
  late_fee_bps: LateFeeBps;
}

/** GET and PUT /v1/organisations/me/cancellation-policy. */
export interface CancellationPolicyResponse {
  cancellation_policy: CancellationPolicy;
  /** False while the school is paused or closed: new bookings then use each instructor's own policy. */
  applied?: boolean;
}

/** Whether the school's policy is in force. Absent (an older API) counts as in force. */
export function policyApplied(raw: unknown): boolean {
  return !(isRecord(raw) && raw.applied === false);
}

/** Newdryve's standard policy, which every school has until it sets its own. */
export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = { notice_hours: 24, late_fee_bps: 5000 };

export const LATE_FEE_OPTIONS: ReadonlyArray<{ value: LateFeeBps; label: string }> = [
  { value: 0, label: "No fee" },
  { value: 5000, label: "Half the lesson price" },
  { value: 10000, label: "Full lesson price" },
];

/** The rules no school can change, worded for the school. */
export const FIXED_CANCELLATION_RULES =
  "Within 30 minutes of the start, a learner cancellation is always charged the full price. Instructors can cancel for free up to 30 minutes before a lesson.";

export function isNoticeHours(value: unknown): value is NoticeHours {
  return (NOTICE_HOURS_OPTIONS as readonly unknown[]).includes(value);
}

export function isLateFeeBps(value: unknown): value is LateFeeBps {
  return (LATE_FEE_BPS_OPTIONS as readonly unknown[]).includes(value);
}

/** 24 → "24 hours". */
export function noticeLabel(hours: NoticeHours): string {
  return `${hours} hours`;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * The policy from an API body (`{ cancellation_policy: {...} }`) or from the
 * policy object itself. Null when either number is missing or not one of the
 * allowed values, so the form never shows a value it cannot save.
 */
export function policyFrom(raw: unknown): CancellationPolicy | null {
  const policy = isRecord(raw) && isRecord(raw.cancellation_policy) ? raw.cancellation_policy : raw;
  if (!isRecord(policy)) return null;
  const { notice_hours, late_fee_bps } = policy;
  return isNoticeHours(notice_hours) && isLateFeeBps(late_fee_bps) ? { notice_hours, late_fee_bps } : null;
}

/**
 * The policy in one or two sentences, worded as learners see it in the app
 * before they book (the app's policySummary).
 */
export function describeCancellationPolicy(policy: CancellationPolicy): string {
  const free = `Free cancellation up to ${noticeLabel(policy.notice_hours)} before.`;
  switch (policy.late_fee_bps) {
    case 0:
      return `${free} After that and until 30 minutes before, still free; within 30 minutes, the full price.`;
    case 10000:
      return `${free} After that, the full lesson price.`;
    default:
      return `${free} After that, half the lesson price; within 30 minutes, the full price.`;
  }
}

/** What the portal route forwards: the policy, plus the school when the admin runs several. */
export interface CancellationPolicyInput extends CancellationPolicy {
  organisation_id?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check a PUT body against the API's allowed values before it is forwarded,
 * and rebuild it from the known fields only. The same rules as the API, so a
 * mistake is caught without the round trip.
 */
export function parseCancellationPolicyInput(
  body: unknown
): { ok: true; input: CancellationPolicyInput } | { ok: false; error: string } {
  if (!isRecord(body)) return { ok: false, error: "Choose a notice period and a late cancellation fee." };
  const { organisation_id, notice_hours, late_fee_bps } = body;
  if (!isNoticeHours(notice_hours)) {
    return { ok: false, error: "Choose a notice period of 2, 6, 12, 24, 48 or 72 hours." };
  }
  if (!isLateFeeBps(late_fee_bps)) {
    return { ok: false, error: "Choose no fee, half the lesson price or the full lesson price." };
  }
  if (organisation_id !== undefined && organisation_id !== null && !(typeof organisation_id === "string" && UUID.test(organisation_id))) {
    return { ok: false, error: "That organisation could not be found." };
  }
  return {
    ok: true,
    input: { ...(typeof organisation_id === "string" ? { organisation_id } : {}), notice_hours, late_fee_bps },
  };
}

/**
 * The settings page's view of one school's policy: the saved policy, not
 * available yet (a 404 from an API deployed before this feature), or a load
 * that failed for another reason.
 */
export type CancellationPolicyLoad =
  | { status: "ready"; policy: CancellationPolicy; applied: boolean }
  | { status: "unavailable" }
  | { status: "error"; message: string };

/**
 * From the page's read of the endpoint. The API's own error text is not shown:
 * a 500's message is not written for a school, and the form cannot fix it.
 */
export function cancellationPolicyLoad(
  read: { ok: true; data: unknown } | { ok: false; status: number }
): CancellationPolicyLoad {
  const policy = read.ok ? policyFrom(read.data) : null;
  if (policy) return { status: "ready", policy, applied: read.ok ? policyApplied(read.data) : true };
  if (!read.ok && read.status === 404) return { status: "unavailable" };
  return { status: "error", message: "Could not load your cancellation policy." };
}
