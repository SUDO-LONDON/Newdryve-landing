import "server-only";

// Core item write path shared by every board and every /ops/api/items route.
// Handles the hybrid column/JSONB split (promoted keys → columns, the rest →
// data) and writes the activity log for creates, edits, stage moves and
// soft-delete/restore. All calls run under the caller's founder RLS session.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OpsItem } from "@/lib/ops/types";

type DB = SupabaseClient;

/** Split a flat values map into promoted columns and JSONB `data`. */
export function splitValues(values: Record<string, unknown>): {
  columns: Record<string, unknown>;
  data: Record<string, unknown>;
} {
  const columns: Record<string, unknown> = {};
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (k === "stage") columns.stage = v ?? null;
    else if (k === "owner") columns.owner_email = v || null;
    else if (k === "next_action") columns.next_action = v || null;
    else if (k === "next_action_date") columns.next_action_date = v || null;
    else data[k] = v;
  }
  return { columns, data };
}

const norm = (x: unknown): string | null =>
  x === undefined || x === null || x === "" ? null : String(x);

function oldValueFor(existing: OpsItem, key: string): unknown {
  switch (key) {
    case "stage":
      return existing.stage;
    case "owner":
      return existing.owner_email;
    case "next_action":
      return existing.next_action;
    case "next_action_date":
      return existing.next_action_date;
    default:
      return (existing.data ?? {})[key];
  }
}

export async function createItem(
  supabase: DB,
  boardId: string,
  values: Record<string, unknown>,
  actor: string
): Promise<OpsItem> {
  const { columns, data } = splitValues(values);
  const { data: row, error } = await supabase
    .from("ops_items")
    .insert({ board_id: boardId, data, created_by: actor, ...columns })
    .select("*")
    .single();
  if (error) throw error;
  await supabase.from("ops_activity").insert({
    item_id: (row as OpsItem).id,
    actor_email: actor,
    kind: "created",
  });
  return row as OpsItem;
}

export async function updateItem(
  supabase: DB,
  id: string,
  values: Record<string, unknown>,
  actor: string
): Promise<OpsItem> {
  const { data: existingRaw, error: e1 } = await supabase
    .from("ops_items")
    .select("*")
    .eq("id", id)
    .single();
  if (e1) throw e1;
  const existing = existingRaw as OpsItem;

  const { columns, data: dataUpdates } = splitValues(values);
  const newData = { ...(existing.data ?? {}), ...dataUpdates };

  const { data: row, error: e2 } = await supabase
    .from("ops_items")
    .update({ data: newData, ...columns })
    .eq("id", id)
    .select("*")
    .single();
  if (e2) throw e2;

  const activities = Object.keys(values)
    .filter((k) => norm(oldValueFor(existing, k)) !== norm(values[k]))
    .map((k) => ({
      item_id: id,
      actor_email: actor,
      kind: k === "stage" ? "stage_change" : "field_change",
      field: k,
      old_value: norm(oldValueFor(existing, k)),
      new_value: norm(values[k]),
    }));
  if (activities.length) await supabase.from("ops_activity").insert(activities);

  return row as OpsItem;
}

export async function setItemDeleted(
  supabase: DB,
  id: string,
  deleted: boolean,
  actor: string
): Promise<OpsItem> {
  const { data: row, error } = await supabase
    .from("ops_items")
    .update({ deleted_at: deleted ? new Date().toISOString() : null })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  await supabase.from("ops_activity").insert({
    item_id: id,
    actor_email: actor,
    kind: deleted ? "deleted" : "restored",
  });
  return row as OpsItem;
}

export async function addNote(
  supabase: DB,
  itemId: string,
  body: string,
  actor: string
) {
  const { data: note, error } = await supabase
    .from("ops_notes")
    .insert({ item_id: itemId, author_email: actor, body })
    .select("*")
    .single();
  if (error) throw error;
  await supabase.from("ops_activity").insert({
    item_id: itemId,
    actor_email: actor,
    kind: "note_added",
    new_value: body.slice(0, 200),
  });
  return note;
}
