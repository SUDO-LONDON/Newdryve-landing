import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBoard } from "@/lib/ops/config";
import { logAudit } from "@/lib/ops/audit";
import { formatValue, itemMatchesQuery, itemValue } from "@/components/ops/format";
import type { OpsItem } from "@/lib/ops/types";

// Escape a single CSV cell per RFC 4180: quote if it contains a comma, quote,
// CR or LF, doubling any embedded quotes.
function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsvRow(values: string[]): string {
  return values.map(csvCell).join(",") + "\r\n";
}

// GET /ops/api/export?board_id=instructors[&q=&stage=&owner=]
// Founder-guarded CSV export of a board's non-deleted items, respecting the
// same filters the board UI supports. Columns follow field order/labels.
export async function GET(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const boardId = req.nextUrl.searchParams.get("board_id");
  if (!boardId) return NextResponse.json({ error: "board_id required" }, { status: 400 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const stage = req.nextUrl.searchParams.get("stage") ?? "";
  const owner = req.nextUrl.searchParams.get("owner") ?? "";

  const cfg = await getBoard(boardId);
  if (!cfg) return NextResponse.json({ error: "board not found" }, { status: 404 });
  const { board, fields } = cfg;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ops_items")
    .select("*")
    .eq("board_id", boardId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let items = (data ?? []) as unknown as OpsItem[];
  if (q) items = items.filter((i) => itemMatchesQuery(i, fields, q));
  if (stage) items = items.filter((i) => i.stage === stage);
  if (owner) items = items.filter((i) => i.owner_email === owner);

  let csv = toCsvRow(fields.map((f) => f.label));
  for (const item of items) {
    csv += toCsvRow(fields.map((f) => formatValue(f, itemValue(item, f.key))));
  }

  await logAudit({
    actor_email: guard.email,
    action: "export",
    target_type: "board",
    target_id: boardId,
    detail: { board_id: boardId, count: items.length, q, stage, owner },
  });

  const filename = `${board.id}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
