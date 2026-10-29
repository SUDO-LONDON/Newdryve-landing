import "server-only";

import { NextResponse } from "next/server";
import type { FeeTerms, FeeTermsInput } from "@/lib/organisations/fees";
import type {
  LessonPresence,
  OpsOrganisation,
  OpsOrganisationMember,
  OpsOrganisationWithMembers,
  OrganisationActivity,
  OrganisationLiveLesson,
  OrganisationMemberStatus,
  OrganisationLearnerProgress,
  OrganisationPayout,
  OrganisationStatus,
  MemberSeat,
  OrganisationUpcomingLesson,
} from "@/lib/ops/types";

const API_ORIGIN = (process.env.NEWDRYVE_API_ORIGIN || "").replace(/\/$/, "");
const OPS_SECRET = process.env.NEWDRYVE_API_OPS_SECRET || "";

export type OrganisationCreateInput = {
  name: string;
  legal_name?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  bio?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  /** Omitted means off until ops sets terms. */
  fee_terms?: FeeTermsInput;
};

export type OrganisationAdminCreateInput = {
  email: string;
  /**
   * Only for a new login. An email that is already a school admin login gains
   * this school and keeps its own password (Newdryve PR #511).
   */
  password?: string;
  display_name?: string | null;
};

type BackendOrganisation = {
  id: string;
  name: string;
  legal_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: OrganisationStatus;
  join_code_last4: string | null;
  billing_mode?: "per_instructor" | "per_seat";
  seats_purchased?: number | null;
  seat_price_pence?: number | null;
  billing_notes?: string | null;
  subscription_status?: string | null;
  bio?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  fee_terms?: FeeTerms | null;
  admin_count?: number;
  live_lessons?: OrganisationLiveLesson[];
  upcoming_today?: OrganisationUpcomingLesson[];
  activity?: OrganisationActivity;
  payouts?: OrganisationPayout[];
  payouts_total_pence?: number;
  learner_progress?: OrganisationLearnerProgress[];
  created_at: string;
  updated_at?: string | null;
  members?: BackendOrganisationMember[];
};

type BackendOrganisationMember = {
  membership_id: string;
  instructor_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  is_listed: boolean;
  linked_at: string;
  in_lesson: boolean;
  current_lesson_id: string | null;
  completed_lessons: number;
  revenue_pence: number;
  late_instructor_cancellations_90d?: number | null;
  sick_days_90d?: number | null;
  seat?: { status?: string | null; paused_until?: string | null; paused_by?: string | null } | null;
};

type OrganisationResponse = {
  organisation: BackendOrganisation;
  join_code?: string;
  fee_terms?: FeeTerms;
};

export class OrganisationApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /** `details.code` when the API gave one, else the envelope's code. */
    public readonly code: string | null = null,
    public readonly details: Record<string, unknown> | null = null
  ) {
    super(message);
  }
}

/**
 * The JSON an /ops route handler answers with when a call fails: the API's
 * status (or `fallbackStatus` for anything that is not an API error), its
 * message, and its code and details, so the browser can act on, say,
 * `details.allowed_modes`.
 */
export function organisationErrorResponse(err: unknown, fallbackMessage: string, fallbackStatus = 400): NextResponse {
  if (err instanceof OrganisationApiError) {
    return NextResponse.json(
      {
        error: err.message,
        ...(err.code ? { code: err.code } : {}),
        ...(err.details ? { details: err.details } : {}),
      },
      { status: err.status >= 400 && err.status < 600 ? err.status : fallbackStatus }
    );
  }
  return NextResponse.json(
    { error: err instanceof Error ? err.message : fallbackMessage },
    { status: fallbackStatus }
  );
}

export function isOrganisationApiConfigured(): boolean {
  return Boolean(API_ORIGIN && OPS_SECRET);
}

export function cleanJoinCode(code: string): string {
  return code.replace(/\D/g, "").slice(0, 8);
}

export async function listOrganisations(
  founderEmail: string
): Promise<OpsOrganisationWithMembers[]> {
  const data = await call<{ items: BackendOrganisation[] }>("/v1/ops/organisations", founderEmail);
  return (data.items ?? []).map((organisation) => mapOrganisation(organisation));
}

export async function getOrganisation(
  id: string,
  founderEmail: string
): Promise<OpsOrganisationWithMembers | null> {
  const organisations = await listOrganisations(founderEmail);
  return organisations.find((organisation) => organisation.id === id) ?? null;
}

export async function createOrganisation(
  input: OrganisationCreateInput,
  actor: string
): Promise<OpsOrganisation> {
  const data = await call<OrganisationResponse>("/v1/ops/organisations", actor, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return mapOrganisation({ ...data.organisation, fee_terms: data.fee_terms ?? null }, data.join_code);
}

export async function updateOrganisation(
  id: string,
  input: Partial<OrganisationCreateInput> & {
    status?: OrganisationStatus;
    billing_mode?: "per_instructor" | "per_seat";
    seats_purchased?: number | null;
    seat_price_pence?: number | null;
    billing_notes?: string | null;
    subscription_status?: string | null;
  },
  actor: string
): Promise<OpsOrganisation> {
  const data = await call<OrganisationResponse>(`/v1/ops/organisations/${id}`, actor, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return mapOrganisation({ ...data.organisation, fee_terms: data.fee_terms ?? null });
}

/** PUT /v1/ops/organisations/:id/fee-terms. Newdryve is the only writer of these. */
export async function setOrganisationFeeTerms(
  id: string,
  input: FeeTermsInput,
  actor: string
): Promise<FeeTerms> {
  const data = await call<{ fee_terms: FeeTerms }>(`/v1/ops/organisations/${id}/fee-terms`, actor, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return data.fee_terms;
}

/**
 * End an instructor's active membership. The API notifies the organisation;
 * 404 when they are not an active member.
 */
export async function removeOrganisationMember(
  id: string,
  instructorId: string,
  actor: string
): Promise<void> {
  await call(`/v1/ops/organisations/${id}/members/${instructorId}`, actor, { method: "DELETE" });
}

export async function regenerateOrganisationCode(
  id: string,
  actor: string
): Promise<OpsOrganisation> {
  const data = await call<OrganisationResponse>(`/v1/ops/organisations/${id}/join-code`, actor, {
    method: "POST",
  });
  return mapOrganisation(data.organisation, data.join_code);
}

/**
 * Create a school admin login, or add this school to an existing one
 * (`existing_login: true`). A blank password is left out of the request: the
 * API wants none for an existing login and answers 422 `password_required`
 * when the email is new.
 */
export async function createOrganisationAdmin(
  id: string,
  input: OrganisationAdminCreateInput,
  actor: string
): Promise<{ existing_login: boolean }> {
  const data = await call<{ existing_login?: boolean }>(`/v1/ops/organisations/${id}/admins`, actor, {
    method: "POST",
    body: JSON.stringify(adminRequestBody(input)),
  });
  return { existing_login: data?.existing_login === true };
}

export function adminRequestBody(input: Partial<OrganisationAdminCreateInput> | null | undefined): OrganisationAdminCreateInput {
  const email = typeof input?.email === "string" ? input.email.trim() : "";
  const password = typeof input?.password === "string" ? input.password : "";
  const displayName = typeof input?.display_name === "string" ? input.display_name.trim() : "";
  return {
    email,
    ...(password ? { password } : {}),
    display_name: displayName || null,
  };
}

async function call<T>(path: string, founderEmail: string, init: RequestInit = {}): Promise<T> {
  if (!isOrganisationApiConfigured()) {
    throw new OrganisationApiError(
      "Organisations are not configured. Set NEWDRYVE_API_ORIGIN and NEWDRYVE_API_OPS_SECRET.",
      503
    );
  }

  let response: Response;
  try {
    response = await fetch(`${API_ORIGIN}${path}`, {
      ...init,
      headers: {
        // Only declare a JSON body when there is one.
        //
        // Fastify rejects a request that says content-type: application/json
        // and then sends nothing — "Body cannot be empty when content-type is
        // set to 'application/json'". Regenerating a join code takes no body,
        // so every attempt failed on the header rather than on anything the
        // route did. Set per request rather than per call site, because the
        // next bodyless endpoint would hit exactly the same wall.
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
        "x-ops-secret": OPS_SECRET,
        "x-ops-founder-email": founderEmail,
        ...(init.headers as Record<string, string> | undefined),
      },
      cache: "no-store",
      // A stalled API must surface as an error, not a page that never loads.
      signal: AbortSignal.timeout(init.method && init.method !== "GET" ? 20_000 : 10_000),
    });
  } catch (err) {
    console.error("[ops/organisations] API unreachable", err);
    throw new OrganisationApiError("Could not reach the Newdryve API.", 502);
  }

  const body = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    const errorBody = body as {
      error?: string | { message?: string; code?: string; details?: Record<string, unknown> };
    } | null;
    const error = errorBody?.error;
    const message =
      typeof error === "string" ? error : error?.message || "The Newdryve API rejected that request.";
    const details = typeof error === "object" && error?.details && typeof error.details === "object" ? error.details : null;
    const code =
      typeof details?.code === "string" ? details.code : typeof error === "object" ? error?.code ?? null : null;
    throw new OrganisationApiError(message, response.status, code, details);
  }

  return body as T;
}

/**
 * The organisation portal reads the same endpoint and needs the same
 * translation.
 *
 * It used to cast the raw API response straight to the client type. The two
 * shapes do not match — the API sends `name`, `in_lesson` and
 * `completed_lessons` where the client reads `display_name`,
 * `lesson_presence` and `lesson_count` — so the members table rendered blank
 * cells and "in a lesson" was permanently zero. `as` is an assertion, not a
 * check, so nothing complained.
 */
export function mapOrganisationResponse(
  organisation: BackendOrganisation
): OpsOrganisationWithMembers {
  return mapOrganisation(organisation);
}

function mapOrganisation(
  organisation: BackendOrganisation,
  plainJoinCode?: string
): OpsOrganisationWithMembers {
  return {
    id: organisation.id,
    name: organisation.name,
    legal_name: organisation.legal_name,
    contact_name: organisation.contact_name,
    contact_email: organisation.contact_email,
    contact_phone: organisation.contact_phone,
    status: organisation.status,
    join_code: plainJoinCode || maskCode(organisation.join_code_last4),
    created_by: null,
    created_at: organisation.created_at,
    billing_mode: organisation.billing_mode ?? "per_instructor",
    seats_purchased: organisation.seats_purchased ?? null,
    seat_price_pence: organisation.seat_price_pence ?? null,
    billing_notes: organisation.billing_notes ?? null,
    subscription_status: organisation.subscription_status ?? null,
    bio: organisation.bio ?? null,
    logo_url: organisation.logo_url ?? null,
    primary_color: organisation.primary_color ?? null,
    fee_terms: organisation.fee_terms ?? null,
    updated_at: organisation.updated_at || organisation.created_at,
    deleted_at: null,
    members: (organisation.members ?? []).map((member) =>
      mapMember(organisation.id, member, organisation.updated_at || organisation.created_at)
    ),
    admin_count: organisation.admin_count ?? 0,
    live_lessons: organisation.live_lessons ?? [],
    upcoming_today: organisation.upcoming_today ?? [],
    activity: organisation.activity,
    payouts: organisation.payouts ?? [],
    payouts_total_pence: organisation.payouts_total_pence ?? 0,
    learner_progress: organisation.learner_progress ?? [],
  };
}

function mapMember(
  organisationId: string,
  member: BackendOrganisationMember,
  fallbackUpdatedAt: string
): OpsOrganisationMember {
  return {
    id: member.membership_id,
    organisation_id: organisationId,
    instructor_id: member.instructor_id,
    profile_id: null,
    display_name: member.name,
    email: member.email,
    phone: member.phone,
    status: mapMemberStatus(member.status, member.is_listed),
    lesson_presence: mapLessonPresence(member.in_lesson),
    active_lesson_label: member.current_lesson_id
      ? `Lesson ${member.current_lesson_id.slice(0, 8)}`
      : null,
    revenue_pence: Number(member.revenue_pence || 0),
    lesson_count: Number(member.completed_lessons || 0),
    last_seen_at: null,
    linked_at: member.linked_at,
    updated_at: fallbackUpdatedAt,
    deleted_at: null,
    late_instructor_cancellations_90d: countOrNull(member.late_instructor_cancellations_90d),
    sick_days_90d: countOrNull(member.sick_days_90d),
    seat: mapSeat(member.seat),
  };
}

function mapSeat(seat: BackendOrganisationMember["seat"]): MemberSeat | null {
  if (!seat || (seat.status !== "active" && seat.status !== "paused")) return null;
  return {
    status: seat.status,
    paused_until: seat.status === "paused" ? seat.paused_until ?? null : null,
    paused_by: seat.paused_by === "organisation_admin" || seat.paused_by === "instructor" ? seat.paused_by : null,
  };
}

function countOrNull(value: number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function maskCode(last4: string | null): string {
  return last4 ? `****${last4}` : "Hidden";
}

function mapMemberStatus(status: string | null, isListed: boolean): OrganisationMemberStatus {
  if (status === "active" || isListed) return "linked";
  if (status === "rejected") return "inactive";
  return "linked";
}

function mapLessonPresence(inLesson: boolean): LessonPresence {
  return inLesson ? "in_lesson" : "available";
}
