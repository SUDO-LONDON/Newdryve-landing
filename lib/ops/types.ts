// Shared types + static navigation for the /ops portal. Board/field config is
// stored in Postgres (ops_boards / ops_fields) and fetched via lib/ops/config;
// the nav below is static because the module→board mapping is fixed by spec.

export type FieldType =
  | "text"
  | "longtext"
  | "email"
  | "url"
  | "number"
  | "date"
  | "select"
  | "stage"
  | "boolean"
  | "currency"
  | "founder_ref";

export interface OpsField {
  id: string;
  board_id: string;
  key: string;
  label: string;
  type: FieldType;
  options: string[] | null;
  required: boolean;
  is_sensitive: boolean;
  note: string | null;
  position: number;
}

export interface OpsBoard {
  id: string;
  module: string;
  name: string;
  description: string | null;
  stages: string[];
  position: number;
}

export interface OpsItem {
  id: string;
  board_id: string;
  stage: string | null;
  owner_email: string | null;
  next_action: string | null;
  next_action_date: string | null;
  data: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OpsNote {
  id: string;
  item_id: string;
  author_email: string | null;
  body: string;
  created_at: string;
}

export interface OpsActivity {
  id: string;
  item_id: string;
  actor_email: string | null;
  kind: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface Founder {
  email: string;
  name: string | null;
  role: string | null;
}

export type OrganisationStatus = "active" | "paused" | "closed";
export type OrganisationMemberStatus = "linked" | "invited" | "inactive";
export type LessonPresence = "available" | "in_lesson" | "offline" | "unknown";

export interface OpsOrganisation {
  id: string;
  name: string;
  legal_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: OrganisationStatus;
  join_code: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  /**
   * per_instructor: every linked instructor pays their own subscription.
   * per_seat: the school pays once for the seats it agreed to.
   */
  billing_mode: "per_instructor" | "per_seat";
  /** Seats bought, not instructors linked — a school buys headroom. */
  seats_purchased: number | null;
  /** Agreed price per seat for THIS school, not the list price. */
  seat_price_pence: number | null;
  billing_notes: string | null;
  subscription_status: string | null;
}

export interface OpsOrganisationMember {
  id: string;
  organisation_id: string;
  instructor_id: string;
  profile_id: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  status: OrganisationMemberStatus;
  lesson_presence: LessonPresence;
  active_lesson_label: string | null;
  revenue_pence: number;
  lesson_count: number;
  last_seen_at: string | null;
  linked_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OrganisationLiveLesson {
  id: string;
  instructor_name: string;
  learner_name: string;
  starts_at: string;
  ends_at: string;
  pickup_address: string | null;
}

export interface OrganisationUpcomingLesson {
  id: string;
  instructor_name: string;
  learner_name: string;
  starts_at: string;
  status: string;
}

export interface OrganisationActivity {
  window_days: number;
  completed: number;
  cancelled: number;
  no_show: number;
  upcoming: number;
  revenue_pence: number;
  /** Null until something has actually reached an outcome. */
  completion_rate: number | null;
  series: Array<{ date: string; lessons: number; revenue_pence: number }>;
}

export interface OrganisationPayout {
  amount_pence: number;
  arrival_date: string | null;
  status: string;
  created_at: string;
}

export interface OrganisationLearnerProgress {
  id: string;
  name: string;
  readiness_percent: number;
  skills_competent: number;
  skills_total: number;
  lessons_completed: number;
  last_lesson_at: string | null;
}

export interface OpsOrganisationWithMembers extends OpsOrganisation {
  members: OpsOrganisationMember[];
  live_lessons?: OrganisationLiveLesson[];
  upcoming_today?: OrganisationUpcomingLesson[];
  activity?: OrganisationActivity;
  payouts?: OrganisationPayout[];
  payouts_total_pence?: number;
  learner_progress?: OrganisationLearnerProgress[];
  /**
   * Active admin logins. Zero means nobody at the school can sign in — the
   * organisation exists and is inert, which is invisible from a list of names
   * and lesson counts.
   */
  admin_count: number;
}

export function organisationTotals(members: OpsOrganisationMember[]) {
  const visible = members.filter((member) => !member.deleted_at);
  return {
    instructors: visible.length,
    inLesson: visible.filter((member) => member.lesson_presence === "in_lesson").length,
    revenuePence: visible.reduce((sum, member) => sum + Number(member.revenue_pence || 0), 0),
    lessonCount: visible.reduce((sum, member) => sum + Number(member.lesson_count || 0), 0),
  };
}

// Finance — funding + spend. Amounts are integer pence.
export interface OpsExpense {
  id: string;
  description: string;
  category: string | null;
  amount_pence: number;
  spent_on: string; // YYYY-MM-DD
  receipt_path: string;
  receipt_mime: string | null;
  created_by: string | null;
  created_at: string;
  deleted_at: string | null;
}

// Weekly KPI assigned to a founder. Created by the CEO; ticked by the assignee.
export interface OpsKpi {
  id: string;
  week_start: string; // YYYY-MM-DD (Monday)
  assignee_email: string;
  title: string;
  detail: string | null;
  done: boolean;
  done_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ---------------------------------------------------------------------------
// Delivery pipeline. A DAG of work: an edge means the `from` node must be done
// before the `to` node can start. Completing a node can unlock someone else's
// work, which is what fires the Discord ping.
// ---------------------------------------------------------------------------

export type PipelineTrack = "frontend" | "backend" | "cloud" | "ops";

export const PIPELINE_TRACKS: PipelineTrack[] = ["frontend", "backend", "cloud", "ops"];

/** Current state of a node, derived from its prerequisites. Never stored. */
export type NodeStatus = "done" | "ready" | "blocked";

export interface OpsPipelineNode {
  id: string;
  key: string;
  title: string;
  detail: string | null;
  /** Definition of done — the agreed condition for ticking this node. */
  dod: string | null;
  track: PipelineTrack;
  owner_email: string | null;
  due_date: string | null; // YYYY-MM-DD
  position: number;
  done: boolean;
  done_at: string | null;
  done_by: string | null;
  /** First moment every prerequisite was satisfied. Set once, never cleared. */
  unlocked_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OpsPipelineEdge {
  id: string;
  from_key: string;
  to_key: string;
  created_by: string | null;
  created_at: string;
}

export type PipelineEventKind =
  | "completed"
  | "reopened"
  | "unlocked"
  | "notified"
  | "notify_failed";

export interface OpsPipelineEvent {
  id: string;
  node_key: string;
  kind: PipelineEventKind;
  actor_email: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

// A QR receipt-capture handoff session. The token is a single-use, 15-minute
// capability that lets a phone upload one receipt photo against it.
export type CaptureStatus = "pending" | "received" | "used" | "expired";

export interface OpsCaptureSession {
  token: string;
  created_by: string;
  status: CaptureStatus;
  receipt_path: string | null;
  receipt_mime: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

/** Format integer pence as GBP, e.g. 750000 → "£7,500.00". */
export function formatPence(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    (pence || 0) / 100
  );
}

/** The Monday (ISO week start) of the week containing `d`, as YYYY-MM-DD. */
export function mondayOf(d: Date = new Date()): string {
  const copy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dow = copy.getUTCDay(); // 0=Sun..6=Sat
  const diff = dow === 0 ? -6 : 1 - dow; // shift back to Monday
  copy.setUTCDate(copy.getUTCDate() + diff);
  return copy.toISOString().slice(0, 10);
}

// Keys promoted to dedicated ops_items columns. The `owner` field maps to the
// owner_email column; every non-promoted field lives in ops_items.data.
export const PROMOTED_KEYS = ["stage", "owner", "next_action", "next_action_date"] as const;

/** Field key → ops_items column name for promoted fields. */
export const PROMOTED_COLUMN: Record<string, string> = {
  stage: "stage",
  owner: "owner_email",
  next_action: "next_action",
  next_action_date: "next_action_date",
};

export function isPromotedKey(key: string): boolean {
  return (PROMOTED_KEYS as readonly string[]).includes(key);
}

export interface NavModule {
  module: string;
  moduleName: string;
  basePath: string;
  boards: { id: string; name: string }[];
}

// Static navigation across the three outreach modules.
export const BOARD_NAV: NavModule[] = [
  {
    module: "customer_outreach",
    moduleName: "Customer Outreach",
    basePath: "/ops/customers",
    boards: [
      { id: "instructors", name: "Instructor Pipeline" },
      { id: "learners", name: "Learner Pipeline" },
      { id: "partnerships", name: "Partnerships" },
    ],
  },
  {
    module: "marketing_outreach",
    moduleName: "Marketing & UGC",
    basePath: "/ops/marketing",
    boards: [
      { id: "creators", name: "Creator & UGC" },
      { id: "press", name: "Press & Media" },
      { id: "campaigns", name: "Campaigns" },
    ],
  },
  {
    module: "investor_outreach",
    moduleName: "Investors & Funding",
    basePath: "/ops/investors",
    boards: [
      { id: "pipeline", name: "Funding Pipeline" },
      { id: "contacts", name: "Investor Contacts" },
      { id: "obligations", name: "Obligations" },
    ],
  },
];

// Data room categories (spec-defined).
export const DATA_ROOM_CATEGORIES: { id: string; name: string }[] = [
  { id: "incorporation", name: "Incorporation & Corporate" },
  { id: "founders", name: "Founders & Equity" },
  { id: "funding", name: "Funding" },
  { id: "legal", name: "Legal & Compliance" },
  { id: "financial", name: "Financial" },
  { id: "product", name: "Product & Technical" },
  { id: "commercial", name: "Commercial" },
  { id: "brand", name: "Brand & Marketing" },
];

/** Route base path for a board's module, e.g. 'instructors' → '/ops/customers'. */
export function boardBasePath(boardId: string): string | null {
  for (const m of BOARD_NAV) {
    if (m.boards.some((b) => b.id === boardId)) return m.basePath;
  }
  return null;
}
