"use client";

import { useEffect, useState } from "react";
import type { Founder, OpsActivity, OpsBoard, OpsField, OpsItem, OpsNote } from "@/lib/ops/types";
import { itemValue } from "@/components/ops/format";
import FieldInput from "@/components/ops/FieldInput";

// Slide-over detail panel: edit any field, read the activity log, add notes.
export default function ItemDrawer({
  board,
  fields,
  founders,
  itemId,
  onClose,
  onSaved,
  onDeleted,
}: {
  board: OpsBoard;
  fields: OpsField[];
  founders: Founder[];
  itemId: string;
  onClose: () => void;
  onSaved: (item: OpsItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [item, setItem] = useState<OpsItem | null>(null);
  const [notes, setNotes] = useState<OpsNote[]>([]);
  const [activity, setActivity] = useState<OpsActivity[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: `loading` starts true and this drawer is mounted with key={itemId}
    // by the parent, so it remounts per item — no synchronous setState needed
    // here to reset it (which React 19 flags as a cascading render).
    let active = true;
    fetch(`/ops/api/items/${itemId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setItem(d.item);
        setNotes(d.notes ?? []);
        setActivity(d.activity ?? []);
        const initial: Record<string, unknown> = {};
        for (const f of fields) initial[f.key] = itemValue(d.item, f.key) ?? "";
        setValues(initial);
        setDirty(false);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [itemId, fields]);

  function setValue(key: string, v: unknown) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/ops/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ values }),
    });
    const d = await res.json();
    setSaving(false);
    if (d.item) {
      setItem(d.item);
      setDirty(false);
      onSaved(d.item);
      // refresh activity
      fetch(`/ops/api/items/${itemId}`)
        .then((r) => r.json())
        .then((x) => setActivity(x.activity ?? []));
    }
  }

  async function addNote() {
    const text = noteText.trim();
    if (!text) return;
    const res = await fetch(`/ops/api/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ item_id: itemId, body: text }),
    });
    const d = await res.json();
    if (d.note) {
      setNotes((n) => [d.note, ...n]);
      setNoteText("");
    }
  }

  async function del() {
    if (!confirm("Move this item to deleted? It can be restored later.")) return;
    const res = await fetch(`/ops/api/items/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(itemId);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
      <aside className="relative h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl border-l border-border">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-3">
          <p className="font-display text-lg text-ink">{board.name}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={del}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-deep-rose hover:bg-blush-surface"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-ink hover:bg-blush-surface"
            >
              Close
            </button>
          </div>
        </div>

        {loading || !item ? (
          <div className="p-6 text-sm text-ink-secondary">Loading…</div>
        ) : (
          <div className="p-5 space-y-6">
            {/* Fields */}
            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="flex items-center gap-2 text-sm font-medium text-ink mb-1">
                    {f.label}
                    {f.is_sensitive && (
                      <span className="rounded bg-blush-surface border border-blush-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-deep-rose">
                        Personal data
                      </span>
                    )}
                  </label>
                  <FieldInput
                    field={f}
                    board={board}
                    founders={founders}
                    value={values[f.key]}
                    onChange={(v) => setValue(f.key, v)}
                  />
                  {f.note && <p className="mt-1 text-xs text-ink-muted">{f.note}</p>}
                </div>
              ))}
            </div>

            {dirty && (
              <div className="sticky bottom-0 flex gap-2 bg-white py-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-lg gradient-bg px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            )}

            {/* Notes */}
            <section>
              <h3 className="text-sm font-semibold text-ink mb-2">Notes</h3>
              <div className="flex gap-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note…"
                  className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[60px]"
                />
                <button
                  onClick={addNote}
                  className="self-start rounded-lg border border-border px-3 py-2 text-sm text-ink hover:bg-blush-surface"
                >
                  Add
                </button>
              </div>
              <ul className="mt-3 space-y-2">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-lg bg-blush-surface border border-blush-border p-3">
                    <p className="text-sm text-ink whitespace-pre-wrap">{n.body}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {n.author_email} · {new Date(n.created_at).toLocaleString("en-GB")}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* Activity */}
            <section>
              <h3 className="text-sm font-semibold text-ink mb-2">Activity</h3>
              <ul className="space-y-1.5">
                {activity.map((a) => (
                  <li key={a.id} className="text-xs text-ink-secondary">
                    <span className="text-ink-muted">
                      {new Date(a.created_at).toLocaleString("en-GB")}
                    </span>{" "}
                    · {a.actor_email ?? "system"} ·{" "}
                    {a.kind === "created" && "created item"}
                    {a.kind === "deleted" && "deleted item"}
                    {a.kind === "restored" && "restored item"}
                    {a.kind === "note_added" && "added a note"}
                    {a.kind === "stage_change" && `stage → ${a.new_value ?? "—"}`}
                    {a.kind === "field_change" && `${a.field}: ${a.old_value ?? "—"} → ${a.new_value ?? "—"}`}
                  </li>
                ))}
                {activity.length === 0 && <li className="text-xs text-ink-muted">No activity yet.</li>}
              </ul>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
