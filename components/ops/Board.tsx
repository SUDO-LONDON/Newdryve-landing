"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Founder, OpsBoard, OpsField, OpsItem } from "@/lib/ops/types";
import { formatValue, itemMatchesQuery, itemValue, primaryFieldKey } from "@/components/ops/format";
import StageBadge from "@/components/ops/StageBadge";
import ItemDrawer from "@/components/ops/ItemDrawer";
import CsvImportDialog from "@/components/ops/CsvImportDialog";
import NewItemModal from "@/components/ops/NewItemModal";

type ViewMode = "kanban" | "table";
interface ViewState {
  mode: ViewMode;
  query: string;
  stageFilter: string;
  ownerFilter: string;
  sortKey: string;
  sortDir: "asc" | "desc";
}

const DEFAULT_VIEW: ViewState = {
  mode: "kanban",
  query: "",
  stageFilter: "",
  ownerFilter: "",
  sortKey: "updated_at",
  sortDir: "desc",
};

export default function Board({
  board,
  fields,
  founders,
  initialItems,
  initialView,
  moduleName,
}: {
  board: OpsBoard;
  fields: OpsField[];
  founders: Founder[];
  initialItems: OpsItem[];
  initialView: Partial<ViewState> | null;
  /** The outreach group this board sits in, for the breadcrumb. */
  moduleName?: string;
}) {
  const [items, setItems] = useState<OpsItem[]>(initialItems);
  const [view, setView] = useState<ViewState>({ ...DEFAULT_VIEW, ...(initialView ?? {}) });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [quickText, setQuickText] = useState("");
  const [quickBusy, setQuickBusy] = useState(false);

  const primaryKey = useMemo(() => primaryFieldKey(fields), [fields]);
  // Quick add: one line, Enter, done. Offered when the only thing a new item
  // needs is its name (and a stage, which takes the first one).
  const quickAddField = useMemo(() => {
    const primary = fields.find((f) => f.key === primaryKey);
    const otherRequired = fields.some((f) => f.required && f.key !== primaryKey && f.type !== "stage");
    return primary && primary.type === "text" && !otherRequired ? primary : null;
  }, [fields, primaryKey]);
  // Columns shown in table / on cards: skip long text for compactness.
  const compactFields = useMemo(
    () => fields.filter((f) => f.type !== "longtext").slice(0, 7),
    [fields]
  );

  // Persist view (debounced) to ops_user_prefs.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      fetch("/ops/api/prefs", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ board_id: board.id, view }),
      });
    }, 600);
    return () => clearTimeout(t);
  }, [view, board.id]);

  const filtered = useMemo(() => {
    let list = items.filter((i) => itemMatchesQuery(i, fields, view.query));
    if (view.stageFilter) list = list.filter((i) => i.stage === view.stageFilter);
    if (view.ownerFilter) list = list.filter((i) => i.owner_email === view.ownerFilter);
    const field = fields.find((f) => f.key === view.sortKey);
    list = [...list].sort((a, b) => {
      const av =
        view.sortKey === "updated_at"
          ? a.updated_at
          : field
          ? itemValue(a, view.sortKey)
          : a.updated_at;
      const bv =
        view.sortKey === "updated_at"
          ? b.updated_at
          : field
          ? itemValue(b, view.sortKey)
          : b.updated_at;
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""), "en-GB", { numeric: true });
      return view.sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [items, fields, view]);

  const setV = (patch: Partial<ViewState>) => setView((v) => ({ ...v, ...patch }));

  // ---- mutations ----------------------------------------------------------
  async function patchItem(id: string, values: Record<string, unknown>) {
    // optimistic
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              stage: "stage" in values ? (values.stage as string) : i.stage,
              owner_email: "owner" in values ? (values.owner as string) : i.owner_email,
              next_action: "next_action" in values ? (values.next_action as string) : i.next_action,
              next_action_date:
                "next_action_date" in values ? (values.next_action_date as string) : i.next_action_date,
              data: { ...i.data, ...stripPromoted(values) },
            }
          : i
      )
    );
    const res = await fetch(`/ops/api/items/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ values }),
    });
    const d = await res.json();
    if (d.item) setItems((prev) => prev.map((i) => (i.id === id ? d.item : i)));
  }

  async function createItem(values: Record<string, unknown>): Promise<boolean> {
    const res = await fetch("/ops/api/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ board_id: board.id, values }),
    });
    const d = await res.json().catch(() => ({}));
    if (d.item) {
      setItems((prev) => [d.item, ...prev]);
      setShowNew(false);
      return true;
    }
    alert(d.error ?? "Failed to create item");
    return false;
  }

  async function quickAdd() {
    const text = quickText.trim();
    if (!text || !quickAddField || quickBusy) return;
    setQuickBusy(true);
    try {
      const values: Record<string, unknown> = { [quickAddField.key]: text };
      if (fields.some((f) => f.key === "stage")) values.stage = board.stages[0] ?? "";
      if (await createItem(values)) setQuickText("");
    } finally {
      setQuickBusy(false);
    }
  }

  async function bulk(action: "stage" | "owner" | "delete", value?: string) {
    const ids = [...selected];
    if (!ids.length) return;
    await fetch("/ops/api/items/bulk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids, action, value }),
    });
    if (action === "delete") {
      setItems((prev) => prev.filter((i) => !selected.has(i.id)));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          selected.has(i.id)
            ? action === "stage"
              ? { ...i, stage: value ?? i.stage }
              : { ...i, owner_email: value ?? null }
            : i
        )
      );
    }
    setSelected(new Set());
  }

  function toggleSel(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  // ---- render -------------------------------------------------------------
  return (
    <div>
      <header className="mb-4">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
          <Link href="/ops/outreach" className="hover:text-ink">
            Outreach
          </Link>
          {moduleName ? ` › ${moduleName}` : ""}
        </p>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl text-ink">{board.name}</h1>
            {board.description && (
              <p className="text-sm text-ink-secondary mt-0.5 max-w-2xl">{board.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/ops/api/export?board_id=${board.id}`}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink hover:bg-blush-surface"
            >
              Export CSV
            </a>
            <button
              onClick={() => setShowImport(true)}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink hover:bg-blush-surface"
            >
              Import CSV
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="rounded-lg gradient-bg px-3 py-1.5 text-sm text-white"
            >
              + New
            </button>
          </div>
        </div>

        {quickAddField && (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void quickAdd();
            }}
          >
            <input
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              disabled={quickBusy}
              aria-label={`Quick add: ${quickAddField.label}`}
              placeholder={board.id === "ideas" ? "Got an idea? Type it and press Enter" : `Quick add: type the ${quickAddField.label.toLowerCase()} and press Enter`}
              className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={quickBusy || !quickText.trim()}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink hover:bg-blush-surface disabled:opacity-60"
            >
              {quickBusy ? "Adding…" : "Add"}
            </button>
          </form>
        )}

        {/* Controls */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={view.query}
            onChange={(e) => setV({ query: e.target.value })}
            placeholder="Search…"
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={view.stageFilter}
            onChange={(e) => setV({ stageFilter: e.target.value })}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm"
          >
            <option value="">All stages</option>
            {board.stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={view.ownerFilter}
            onChange={(e) => setV({ ownerFilter: e.target.value })}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm"
          >
            <option value="">All owners</option>
            {founders.map((f) => (
              <option key={f.email} value={f.email}>
                {f.name ?? f.email}
              </option>
            ))}
          </select>
          <select
            value={view.sortKey}
            onChange={(e) => setV({ sortKey: e.target.value })}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm"
          >
            <option value="updated_at">Sort: Last updated</option>
            {fields
              .filter((f) => f.type !== "longtext")
              .map((f) => (
                <option key={f.key} value={f.key}>
                  Sort: {f.label}
                </option>
              ))}
          </select>
          <button
            onClick={() => setV({ sortDir: view.sortDir === "asc" ? "desc" : "asc" })}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm"
            title="Toggle sort direction"
          >
            {view.sortDir === "asc" ? "↑" : "↓"}
          </button>

          <div className="ml-auto inline-flex rounded-lg border border-border overflow-hidden">
            {(["kanban", "table"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setV({ mode: m })}
                className={`px-3 py-1.5 text-sm ${
                  view.mode === m ? "bg-racing-green text-white" : "bg-white text-ink-secondary"
                }`}
              >
                {m === "kanban" ? "Board" : "Table"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span>{filtered.length} items</span>
          {filtered.length > 0 && (
            <button
              onClick={() => setSelected(new Set(filtered.map((i) => i.id)))}
              className="text-racing-green hover:underline"
            >
              Select visible
            </button>
          )}
        </div>
      </header>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm">
          <span className="text-ink">{selected.size} selected</span>
          <select
            onChange={(e) => e.target.value && bulk("stage", e.target.value)}
            defaultValue=""
            className="rounded border border-border px-2 py-1"
          >
            <option value="">Move to stage…</option>
            {board.stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => bulk("owner", e.target.value)}
            defaultValue=""
            className="rounded border border-border px-2 py-1"
          >
            <option value="">Assign owner…</option>
            {founders.map((f) => (
              <option key={f.email} value={f.email}>
                {f.name ?? f.email}
              </option>
            ))}
          </select>
          <button
            onClick={() => confirm(`Delete ${selected.size} items?`) && bulk("delete")}
            className="rounded border border-border px-2 py-1 text-deep-rose"
          >
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="text-ink-muted">
            Clear
          </button>
        </div>
      )}

      {view.mode === "kanban" ? (
        <KanbanView
          board={board}
          fields={compactFields}
          primaryKey={primaryKey}
          items={filtered}
          selected={selected}
          onToggle={toggleSel}
          onOpen={setDrawerId}
          onDropStage={(id, stage) => patchItem(id, { stage })}
        />
      ) : (
        <TableView
          fields={compactFields}
          primaryKey={primaryKey}
          items={filtered}
          selected={selected}
          onToggle={toggleSel}
          onOpen={setDrawerId}
        />
      )}

      {showNew && (
        <NewItemModal
          board={board}
          fields={fields}
          founders={founders}
          onCancel={() => setShowNew(false)}
          onCreate={createItem}
        />
      )}

      {showImport && (
        <CsvImportDialog
          board={board}
          fields={fields}
          onClose={() => setShowImport(false)}
          onImported={() => {
            fetch(`/ops/api/items?board_id=${board.id}`)
              .then((r) => r.json())
              .then((d) => setItems(d.items));
          }}
        />
      )}

      {drawerId && (
        <ItemDrawer
          key={drawerId}
          board={board}
          fields={fields}
          founders={founders}
          itemId={drawerId}
          onClose={() => setDrawerId(null)}
          onSaved={(it) => setItems((prev) => prev.map((i) => (i.id === it.id ? it : i)))}
          onDeleted={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        />
      )}
    </div>
  );
}

function stripPromoted(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (!["stage", "owner", "next_action", "next_action_date"].includes(k)) out[k] = v;
  }
  return out;
}

// ---- Kanban ---------------------------------------------------------------
function KanbanView({
  board,
  fields,
  primaryKey,
  items,
  selected,
  onToggle,
  onOpen,
  onDropStage,
}: {
  board: OpsBoard;
  fields: OpsField[];
  primaryKey: string;
  items: OpsItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onDropStage: (id: string, stage: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const byStage = (stage: string) => items.filter((i) => (i.stage ?? "") === stage);
  const unstaged = items.filter((i) => !i.stage || !board.stages.includes(i.stage));

  const columns = [...board.stages, ...(unstaged.length ? ["—"] : [])];

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columns.map((stage) => {
        const list = stage === "—" ? unstaged : byStage(stage);
        return (
          <div
            key={stage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId && stage !== "—") onDropStage(dragId, stage);
              setDragId(null);
            }}
            className="w-72 shrink-0 rounded-xl bg-white/60 border border-border p-2"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-medium text-ink">{stage}</span>
              <span className="text-xs text-ink-muted">{list.length}</span>
            </div>
            <div className="space-y-2">
              {list.map((i) => (
                <div
                  key={i.id}
                  draggable
                  onDragStart={() => setDragId(i.id)}
                  className="rounded-lg border border-border bg-white p-3 hover:shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(i.id)}
                      onChange={() => onToggle(i.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
                      aria-label={`Select ${String(itemValue(i, primaryKey) ?? "item")}`}
                    />
                    <button
                      onClick={() => onOpen(i.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-medium text-ink">
                        {String(itemValue(i, primaryKey) ?? "Untitled")}
                      </p>
                    </button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {fields
                      .filter((f) => f.key !== primaryKey && f.type !== "stage")
                      .slice(0, 3)
                      .map((f) => {
                        const val = formatValue(f, itemValue(i, f.key));
                        if (!val) return null;
                        return (
                          <span key={f.key} className="text-xs text-ink-secondary">
                            {val}
                          </span>
                        );
                      })}
                  </div>
                  {i.owner_email && (
                    <p className="mt-1 text-[11px] text-ink-muted">{i.owner_email}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Table ----------------------------------------------------------------
function TableView({
  fields,
  primaryKey,
  items,
  selected,
  onToggle,
  onOpen,
}: {
  fields: OpsField[];
  primaryKey: string;
  items: OpsItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-ink-secondary">
            <th className="w-10 px-3 py-2"></th>
            {fields.map((f) => (
              <th key={f.key} className="px-3 py-2 font-medium whitespace-nowrap">
                {f.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-b border-border/60 hover:bg-blush-surface/40">
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.has(i.id)}
                  onChange={() => onToggle(i.id)}
                  className="h-4 w-4 rounded border-border"
                />
              </td>
              {fields.map((f) => (
                <td key={f.key} className="px-3 py-2 align-top">
                  {f.type === "stage" ? (
                    <StageBadge stage={i.stage} />
                  ) : f.key === primaryKey ? (
                    <button
                      onClick={() => onOpen(i.id)}
                      className="text-racing-green hover:underline font-medium text-left"
                    >
                      {String(itemValue(i, f.key) ?? "Untitled")}
                    </button>
                  ) : (
                    <span className="text-ink-secondary">
                      {formatValue(f, itemValue(i, f.key)) || "—"}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={fields.length + 1} className="px-3 py-8 text-center text-ink-muted">
                No items.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
