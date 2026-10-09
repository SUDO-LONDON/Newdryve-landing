/**
 * Shapes returned by the school portal's API routes
 * (backend/src/modules/organisations/insights.ts and invoices.ts).
 * Kept client-safe: no server imports, so components can use them.
 */

export interface OrgRef {
  id: string;
  name: string;
}

export interface Interval {
  from: string;
  to: string;
}

export type LiveStatusCode =
  | "in_lesson"
  | "wrapping_up"
  | "taking_payment"
  | "payment_issue"
  | "checking_in"
  | "running_late"
  | "lesson_due"
  | "busy"
  | "free"
  | "clocked_out"
  | "off";

export interface ClockDay {
  date: string;
  state: "none" | "in" | "out";
  first_in_at: string | null;
  last_out_at: string | null;
  clocked_minutes: number;
}

export interface LiveInstructor {
  instructor_id: string;
  organisation_id: string;
  name: string;
  phone: string | null;
  status: {
    code: LiveStatusCode;
    label: string;
    detail: string | null;
    booking_id: string | null;
    free_from: string | null;
    free_until: string | null;
    free_windows: Interval[];
    working_windows: Interval[];
    clock: ClockDay;
  };
  lessons_today: Array<{ id: string; starts_at: string; ends_at: string; status: string; learner_name: string }>;
  blocks_today: Array<{ starts_at: string; ends_at: string; label: string }>;
  next_lesson: { id: string; starts_at: string; learner_name: string } | null;
}

export interface LiveResponse {
  generated_at: string;
  date: string;
  organisations: OrgRef[];
  instructors: LiveInstructor[];
}

export interface TimesheetDay {
  date: string;
  lesson_minutes: number;
  lessons: number;
  no_shows: number;
  cancelled_by_instructor: number;
  cancelled_by_learner: number;
  revenue_pence: number;
  clocked_minutes: number;
  first_in_at: string | null;
  last_out_at: string | null;
}

export interface TimesheetInstructor {
  instructor_id: string;
  organisation_id: string;
  name: string;
  week_start: string;
  days: TimesheetDay[];
  totals: Omit<TimesheetDay, "date" | "first_in_at" | "last_out_at">;
}

export interface TimesheetResponse {
  week_start: string;
  organisations: OrgRef[];
  instructors: TimesheetInstructor[];
}

export interface AttentionFlag {
  code: "gone_quiet" | "instructor_cancels";
  severity: "watch" | "act";
  label: string;
}

export interface LearnerRow {
  instructor_id: string;
  student_id: string;
  organisation_id: string | null;
  instructor_name: string;
  learner_name: string;
  lessons: number;
  completed_minutes: number;
  last_lesson_at: string | null;
  next_lesson_at: string | null;
  days_since_last_lesson: number | null;
  instructor_cancellations: number;
  learner_cancellations: number;
  no_shows: number;
  learner_cancelled_last: boolean;
  flags: AttentionFlag[];
  days: Array<{ date: string; minutes: number; instructor_cancelled: number; learner_cancelled: number; no_show: number }>;
  nudges: number;
  last_nudged_at: string | null;
}

export interface LearnersResponse {
  generated_at: string;
  weeks: number;
  organisations: OrgRef[];
  instructors: Array<{ instructor_id: string; organisation_id: string; name: string }>;
  learners: LearnerRow[];
}

export type FeeMode = "off" | "per_hour" | "per_lesson" | "percent_of_revenue" | "flat_weekly";

export interface BillingSettings {
  organisation_id: string;
  fee_mode: FeeMode;
  amount_pence: number | null;
  percent_bps: number | null;
  payment_terms_days: number;
  bank_account_name: string | null;
  bank_sort_code: string | null;
  bank_account_number: string | null;
  invoice_from_name: string | null;
  invoice_from_address: string | null;
  invoice_notes: string | null;
}

export interface BillingResponse {
  organisations: Array<{ id: string; name: string; legal_name: string | null; billing: BillingSettings }>;
}

export interface Invoice {
  id: string;
  organisation_id: string;
  instructor_id: string;
  number: string;
  period_start: string;
  period_end: string;
  lessons: number;
  lesson_minutes: number;
  revenue_pence: number;
  amount_pence: number;
  terms: {
    fee_mode: FeeMode;
    amount_pence: number | null;
    percent_bps: number | null;
    description: string;
    payment_terms_days: number;
    from_name: string;
    from_address: string | null;
    bank: { account_name: string; sort_code: string; account_number: string } | null;
    notes: string | null;
    organisation_name: string;
    instructor_name: string;
  };
  status: "issued" | "paid" | "void";
  issued_at: string;
  due_on: string;
  paid_at: string | null;
  emailed_at: string | null;
}
