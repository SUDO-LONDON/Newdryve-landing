import "server-only";

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
};

export type OrganisationAdminCreateInput = {
  email: string;
  password: string;
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
};

type OrganisationResponse = {
  organisation: BackendOrganisation;
  join_code?: string;
};

export class OrganisationApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
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
  return mapOrganisation(data.organisation, data.join_code);
}

export async function updateOrganisation(
  id: string,
  input: Partial<OrganisationCreateInput> & { status?: OrganisationStatus },
  actor: string
): Promise<OpsOrganisation> {
  const data = await call<OrganisationResponse>(`/v1/ops/organisations/${id}`, actor, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return mapOrganisation(data.organisation);
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

export async function createOrganisationAdmin(
  id: string,
  input: OrganisationAdminCreateInput,
  actor: string
): Promise<void> {
  await call(`/v1/ops/organisations/${id}/admins`, actor, {
    method: "POST",
    body: JSON.stringify(input),
  });
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
    });
  } catch (err) {
    console.error("[ops/organisations] API unreachable", err);
    throw new OrganisationApiError("Could not reach the Newdryve API.", 502);
  }

  const body = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    const errorBody = body as { error?: string | { message?: string } } | null;
    const message =
      typeof errorBody?.error === "string"
        ? errorBody.error
        : errorBody?.error?.message || "The Newdryve API rejected that request.";
    throw new OrganisationApiError(message, response.status);
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
  };
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
