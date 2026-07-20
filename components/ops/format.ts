import type { OpsField, OpsItem } from "@/lib/ops/types";

// Read a field's value from an item, transparently handling promoted columns.
export function itemValue(item: OpsItem, key: string): unknown {
  switch (key) {
    case "stage":
      return item.stage;
    case "owner":
      return item.owner_email;
    case "next_action":
      return item.next_action;
    case "next_action_date":
      return item.next_action_date;
    default:
      return (item.data ?? {})[key];
  }
}

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

// Human-readable rendering of a value for a given field type.
export function formatValue(field: OpsField, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  switch (field.type) {
    case "currency": {
      const n = Number(value);
      return Number.isNaN(n) ? String(value) : gbp.format(n);
    }
    case "boolean":
      return value ? "Yes" : "No";
    default:
      return String(value);
  }
}

// The field used as a card/row title: first required text field, else first text.
export function primaryFieldKey(fields: OpsField[]): string {
  const req = fields.find((f) => f.required && f.type === "text");
  if (req) return req.key;
  const text = fields.find((f) => f.type === "text");
  if (text) return text.key;
  return fields[0]?.key ?? "id";
}

// Case-insensitive match of a query across all of an item's values.
export function itemMatchesQuery(item: OpsItem, fields: OpsField[], q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return fields.some((f) => {
    const v = itemValue(item, f.key);
    return v != null && String(v).toLowerCase().includes(needle);
  });
}
