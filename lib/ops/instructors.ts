import "server-only";

// Client for the live product API's instructor-application endpoints.
//
// Instructor data lives in the PRODUCT Supabase project (bflawkbrymcgrqabejbh),
// which is a different project from the one backing this portal. Rather than
// give the marketing/ops service a second service-role key over the live
// product database, /ops calls the Fastify API server-to-server and that API
// remains the only writer of instructor records.
//
// Two credentials go on every call: a shared secret proving the request came
// from /ops, and the acting founder's email, which the API re-checks against
// its own allowlist and writes into the approval audit columns. A leaked secret
// on its own therefore still cannot act as an arbitrary founder.

const API_ORIGIN = (process.env.NEWDRYVE_API_ORIGIN || "").replace(/\/$/, "");
const OPS_SECRET = process.env.NEWDRYVE_API_OPS_SECRET || "";

export type ApplicationStatus = "pending" | "payment_pending" | "active" | "rejected";

export interface InstructorDocument {
  uploaded: boolean;
  /** Short-lived signed URL, ~5 minutes. Never persist or log this. */
  url: string | null;
}

export interface InstructorApplication {
  id: string;
  profile_id: string;
  tenant_id: string;
  status: ApplicationStatus;
  bio: string | null;
  price_per_hour_pence: number;
  transmissions: string[] | null;
  specialisms: string[] | null;
  service_areas: string[] | null;
  car_make: string | null;
  car_model: string | null;
  car_color: string | null;
  adi_number: string | null;
  adi_verified: boolean;
  dbs_verified: boolean;
  is_listed: boolean;
  listing_approved: boolean;
  application_notes: string | null;
  applied_at: string | null;
  approved_at: string | null;
  approved_by_email: string | null;
  rejected_at: string | null;
  rejected_by_email: string | null;
  rejection_reason: string | null;
  created_at: string;
  profiles: { display_name: string | null; email: string | null; phone_e164: string | null } | null;
  tenants: {
    slug: string;
    display_name: string;
    connect_status: "pending" | "onboarded" | "disabled";
    subscription_status: string;
    subscription_monthly_amount_pence: number;
    subscription_trial_months: number;
    subscription_trial_source: "word_of_mouth" | "referral" | "other" | null;
    subscription_trial_note: string | null;
    subscription_trial_started_at: string | null;
    subscription_trial_ends_at: string | null;
    subscription_last_amount_paid_pence: number | null;
    subscription_last_paid_at: string | null;
    subscription_current_period_end: string | null;
  } | null;
  documents: { adi: InstructorDocument; dbs: InstructorDocument };
}

export class InstructorApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export function isInstructorApiConfigured(): boolean {
  return Boolean(API_ORIGIN && OPS_SECRET);
}

async function call<T>(
  path: string,
  founderEmail: string,
  init: RequestInit = {}
): Promise<T> {
  if (!isInstructorApiConfigured()) {
    throw new InstructorApiError(
      "Instructor approvals are not configured. Set NEWDRYVE_API_ORIGIN and NEWDRYVE_API_OPS_SECRET.",
      503
    );
  }

  let response: Response;
  try {
    response = await fetch(`${API_ORIGIN}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-ops-secret": OPS_SECRET,
        "x-ops-founder-email": founderEmail,
        ...(init.headers as Record<string, string> | undefined),
      },
      // Approval state must never be served from a cache.
      cache: "no-store",
    });
  } catch (err) {
    console.error("[ops/instructors] API unreachable", err);
    throw new InstructorApiError("Could not reach the Newdryve API.", 502);
  }

  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;

  if (!response.ok) {
    throw new InstructorApiError(
      body?.error?.message || "The Newdryve API rejected that request.",
      response.status
    );
  }

  return body as T;
}

export async function listInstructorApplications(
  founderEmail: string,
  status: ApplicationStatus | "all" = "pending"
): Promise<InstructorApplication[]> {
  const data = await call<{ items: InstructorApplication[] }>(
    `/v1/ops/instructor-applications?status=${status}`,
    founderEmail
  );
  return data.items ?? [];
}

export async function approveInstructor(
  founderEmail: string,
  id: string,
  options: {
    adi_verified: boolean;
    dbs_verified: boolean;
    is_listed: boolean;
    monthly_amount_pence: number;
    trial_months: number;
    trial_source: "word_of_mouth" | "referral" | "other" | null;
    trial_note: string | null;
  }
): Promise<void> {
  await call(`/v1/ops/instructor-applications/${id}/approve`, founderEmail, {
    method: "POST",
    body: JSON.stringify(options),
  });
}

export async function updateInstructorBilling(
  founderEmail: string,
  id: string,
  monthlyAmountPence: number
): Promise<void> {
  await call(`/v1/ops/instructor-applications/${id}/billing`, founderEmail, {
    method: "PATCH",
    body: JSON.stringify({ monthly_amount_pence: monthlyAmountPence }),
  });
}

export async function resendInstructorActivation(founderEmail: string, id: string): Promise<void> {
  await call(`/v1/ops/instructor-applications/${id}/resend-activation`, founderEmail, {
    method: "POST",
  });
}

export async function rejectInstructor(
  founderEmail: string,
  id: string,
  reason: string | null
): Promise<void> {
  await call(`/v1/ops/instructor-applications/${id}/reject`, founderEmail, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function reinstateInstructor(founderEmail: string, id: string): Promise<void> {
  await call(`/v1/ops/instructor-applications/${id}/reinstate`, founderEmail, {
    method: "POST",
  });
}
