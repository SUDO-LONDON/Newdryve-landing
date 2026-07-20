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
