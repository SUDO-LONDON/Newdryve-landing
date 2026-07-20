import { NextResponse, type NextRequest } from "next/server";
import Papa from "papaparse";
import { isGuardError, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createItem } from "@/lib/ops/items";
import { getBoard } from "@/lib/ops/config";
import type { OpsField } from "@/lib/ops/types";

// POST /ops/api/import
//   { action: "preview", board_id, csv }               -> { headers, rows, suggestedMapping }
//   { action: "commit",  board_id, mapping, rows }     -> { inserted, errors }
//
// Founder-guarded CSV import for any ops board. See CsvImportDialog.tsx for
// the client flow: parse locally, request a suggested column mapping, let the
// founder confirm/adjust it, then commit.

const PREVIEW_ROW_LIMIT = 20;

// Case-insensitive, punctuation-insensitive comparison key, e.g.
// "Mobile Number" and "mobile_number" both normalize to "mobilenumber".
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const TRUTHY_VALUES = new Set(["yes", "y", "true", "1", "x", "✓", "✔"]);

function isTruthy(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  return TRUTHY_VALUES.has(String(v).trim().toLowerCase());
}

// Coerce a raw CSV string cell into the shape the field expects.
function coerceValue(field: OpsField, raw: unknown): unknown {
  if (raw === undefined || raw === null) return raw;
  if (field.type === "boolean") return isTruthy(raw);
  const s = String(raw).trim();
  if (s === "") return "";
  if (field.type === "number" || field.type === "currency") {
    const n = Number(s.replace(/[£$,\s]/g, ""));
    return Number.isNaN(n) ? s : n;
  }
  return s;
}

// Best-effort default column mapping: match each CSV header to a field by
// case/punctuation-insensitive comparison against the field's key or label.
function buildSuggestedMapping(
  headers: string[],
  fields: OpsField[],
  boardId: string
): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const norm = normalize(header);
    const match = fields.find((f) => normalize(f.key) === norm || normalize(f.label) === norm);
    mapping[header] = match ? match.key : "";
  }

  // Instructor ADI tracker: known spreadsheet header aliases.
  if (boardId === "instructors") {
    const aliases: Record<string, string> = {
      businessname: "business_name",
      mobilenumber: "mobile",
      website: "website",
    };
    for (const header of headers) {
      const norm = normalize(header);
      const target = aliases[norm];
      if (target && fields.some((f) => f.key === target)) {
        mapping[header] = target;
      }
    }
  }

  return mapping;
}

function findHeader(headers: string[], name: string): string | undefined {
  const norm = normalize(name);
  return headers.find((h) => normalize(h) === norm);
}

// Instructor ADI tracker: derive `stage` from Sent/Response/Interested columns
// (any of which may be absent). Returns null if none of the three are present
// in this CSV at all, so unrelated imports are left untouched.
function deriveInstructorStage(row: Record<string, unknown>, headers: string[]): string | null {
  const sentHeader = findHeader(headers, "sent");
  const responseHeader = findHeader(headers, "response");
  const interestedHeader = findHeader(headers, "interested");
  if (!sentHeader && !responseHeader && !interestedHeader) return null;

  if (interestedHeader && isTruthy(row[interestedHeader])) return "Interested";
  if (responseHeader && isTruthy(row[responseHeader])) return "Replied";
  if (sentHeader && isTruthy(row[sentHeader])) return "Contacted";
  return "Not contacted";
}

export async function POST(req: NextRequest) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const boardId = body?.board_id;
  if (!boardId || typeof boardId !== "string" || (action !== "preview" && action !== "commit")) {
    return NextResponse.json(
      { error: "board_id and a valid action ('preview' | 'commit') are required" },
      { status: 400 }
    );
  }

  const config = await getBoard(boardId);
  if (!config) return NextResponse.json({ error: "unknown board" }, { status: 404 });
  const { fields } = config;

  if (action === "preview") {
    const csv = body?.csv;
    if (typeof csv !== "string" || !csv.trim()) {
      return NextResponse.json({ error: "csv text is required" }, { status: 400 });
    }
    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    });
    const headers = parsed.meta.fields ?? [];
    const rows = parsed.data.slice(0, PREVIEW_ROW_LIMIT);
    const suggestedMapping = buildSuggestedMapping(headers, fields, boardId);
    return NextResponse.json({ headers, rows, suggestedMapping });
  }

  // action === "commit"
  const mapping = body?.mapping;
  const rows = body?.rows;
  if (typeof mapping !== "object" || mapping === null || !Array.isArray(rows)) {
    return NextResponse.json({ error: "mapping and rows are required" }, { status: 400 });
  }

  const fieldByKey = new Map(fields.map((f) => [f.key, f] as const));
  const csvHeaders = Object.keys(mapping as Record<string, unknown>);
  const mappingEntries = Object.entries(mapping as Record<string, unknown>).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== ""
  );

  const supabase = await createSupabaseServerClient();
  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = (rows[i] ?? {}) as Record<string, unknown>;
    try {
      const values: Record<string, unknown> = {};
      for (const [csvHeader, fieldKey] of mappingEntries) {
        const field = fieldByKey.get(fieldKey);
        if (!field) continue;
        const raw = row[csvHeader];
        if (raw === undefined || raw === null || raw === "") continue;
        values[fieldKey] = coerceValue(field, raw);
      }

      if (boardId === "instructors") {
        const derivedStage = deriveInstructorStage(row, csvHeaders);
        if (derivedStage) values.stage = derivedStage;
      }

      if (!Object.keys(values).length) {
        errors.push(`Row ${i + 1}: no mapped values, skipped`);
        continue;
      }

      await createItem(supabase, boardId, values, guard.email);
      inserted++;
    } catch (e) {
      errors.push(`Row ${i + 1}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ inserted, errors });
}
