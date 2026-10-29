import type { LiveInstructor } from "@/lib/organisations/types";
import type { OpsOrganisationWithMembers } from "@/lib/ops/types";

export function liveInstructor(overrides: Partial<LiveInstructor> = {}): LiveInstructor {
  return {
    instructor_id: "i1",
    organisation_id: "o1",
    name: "Sam Driver",
    phone: null,
    status: {
      code: "busy",
      label: "Busy",
      detail: "sick_day until 17:00",
      booking_id: null,
      free_from: null,
      free_until: null,
      free_windows: [],
      working_windows: [{ from: "2026-10-20T08:00:00.000Z", to: "2026-10-20T17:00:00.000Z" }],
      clock: { date: "2026-10-20", state: "none", first_in_at: null, last_out_at: null, clocked_minutes: 0 },
    },
    lessons_today: [],
    blocks_today: [{ starts_at: "2026-10-20T08:00:00.000Z", ends_at: "2026-10-20T17:00:00.000Z", label: "sick_day" }],
    next_lesson: null,
    ...overrides,
  };
}


export function opsOrganisation(overrides: Partial<OpsOrganisationWithMembers> = {}): OpsOrganisationWithMembers {
  return {
    id: "11111111-2222-4333-8444-555555555555",
    name: "Acme Driving",
    legal_name: "Acme Driving Ltd",
    contact_name: "Ana",
    contact_email: "ana@acme.test",
    contact_phone: null,
    status: "active",
    join_code: "****1234",
    created_by: null,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    deleted_at: null,
    billing_mode: "per_instructor",
    seats_purchased: null,
    seat_price_pence: null,
    billing_notes: null,
    subscription_status: null,
    bio: null,
    logo_url: null,
    primary_color: null,
    fee_terms: null,
    members: [
      {
        id: "m1",
        organisation_id: "11111111-2222-4333-8444-555555555555",
        instructor_id: "i1",
        profile_id: null,
        display_name: "Sam Driver",
        email: "sam@acme.test",
        phone: null,
        status: "linked",
        lesson_presence: "available",
        active_lesson_label: null,
        revenue_pence: 12000,
        lesson_count: 4,
        last_seen_at: null,
        linked_at: "2026-09-02T00:00:00.000Z",
        updated_at: "2026-09-02T00:00:00.000Z",
        deleted_at: null,
        late_instructor_cancellations_90d: 2,
        sick_days_90d: 1,
        seat: { status: "active", paused_until: null, paused_by: null },
      },
    ],
    admin_count: 0,
    ...overrides,
  };
}
