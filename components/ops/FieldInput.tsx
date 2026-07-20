"use client";

import type { Founder, OpsBoard, OpsField } from "@/lib/ops/types";

const inputCls =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ring";

// Renders the correct control for a field type. Value is always passed/returned
// in its stored shape (string for text/date/select, number for currency/number,
// boolean for boolean).
export default function FieldInput({
  field,
  board,
  founders,
  value,
  onChange,
  autoFocus,
}: {
  field: OpsField;
  board: OpsBoard;
  founders: Founder[];
  value: unknown;
  onChange: (v: unknown) => void;
  autoFocus?: boolean;
}) {
  const v = value ?? "";

  switch (field.type) {
    case "stage":
      return (
        <select
          className={inputCls}
          value={String(v)}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        >
          <option value="">—</option>
          {board.stages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      );

    case "select":
      return (
        <select
          className={inputCls}
          value={String(v)}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        >
          <option value="">—</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );

    case "founder_ref":
      return (
        <select
          className={inputCls}
          value={String(v)}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        >
          <option value="">Unassigned</option>
          {founders.map((f) => (
            <option key={f.email} value={f.email}>
              {f.name ? `${f.name}${f.role ? ` (${f.role})` : ""}` : f.email}
            </option>
          ))}
        </select>
      );

    case "boolean":
      return (
        <label className="inline-flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={Boolean(v)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          {field.label}
        </label>
      );

    case "longtext":
      return (
        <textarea
          className={`${inputCls} min-h-[88px]`}
          value={String(v)}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        />
      );

    case "number":
    case "currency":
      return (
        <input
          type="number"
          step={field.type === "currency" ? "0.01" : "1"}
          className={inputCls}
          value={v === "" ? "" : Number(v)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          autoFocus={autoFocus}
        />
      );

    case "date":
      return (
        <input
          type="date"
          className={inputCls}
          value={String(v)}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        />
      );

    case "email":
      return (
        <input
          type="email"
          className={inputCls}
          value={String(v)}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        />
      );

    case "url":
      return (
        <input
          type="url"
          className={inputCls}
          value={String(v)}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        />
      );

    default:
      return (
        <input
          type="text"
          className={inputCls}
          value={String(v)}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        />
      );
  }
}
