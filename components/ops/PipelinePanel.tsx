"use client";

// Delivery pipeline — replaces the flat weekly-KPI list.
//
// The unit of work is a node in a dependency graph rather than a checklist row.
// Ticking a node is only possible once its prerequisites are done, and doing so
// unlocks downstream work and pings its owner on Discord. That makes the handoff
// between the three tracks explicit instead of relying on someone remembering to
// tell the next person they are unblocked.

import { useMemo, useState } from "react";
import type {
  Founder,
  OpsPipelineEdge,
  OpsPipelineNode,
  PipelineTrack,
} from "@/lib/ops/types";
import { PIPELINE_TRACKS } from "@/lib/ops/types";
import {
  blockedBy,
  bottlenecks,
  buildGraph,
  criticalPath,
  ownerStats,
  statusMap,
  trackProgress,
  wouldUnlock,
} from "@/lib/ops/pipeline";
import PipelineGraph from "@/components/ops/PipelineGraph";

type Flash = { tone: "ok" | "warn" | "error"; text: string };

export default function PipelinePanel({
  initialNodes,
  initialEdges,
  founders,
  isCeo,
  currentEmail,
}: {
  initialNodes: OpsPipelineNode[];
  initialEdges: OpsPipelineEdge[];
  founders: Founder[];
  isCeo: boolean;
  currentEmail: string;
}) {
  const [nodes, setNodes] = useState<OpsPipelineNode[]>(initialNodes);
  const [edges, setEdges] = useState<OpsPipelineEdge[]>(initialEdges);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const graph = useMemo(() => buildGraph(nodes, edges), [nodes, edges]);
  const statuses = useMemo(() => statusMap(graph), [graph]);
  const tracks = useMemo(() => trackProgress(graph), [graph]);
  const tops = useMemo(() => bottlenecks(graph).slice(0, 3), [graph]);
  const path = useMemo(() => criticalPath(graph), [graph]);
  const stats = useMemo(() => ownerStats(graph), [graph]);

  const nameFor = useMemo(() => {
    const map = new Map(founders.map((f) => [f.email.toLowerCase(), f.name || f.email]));
    return (email: string | null) =>
      email ? (map.get(email.toLowerCase()) ?? email) : "Unassigned";
  }, [founders]);

  const doneCount = nodes.filter((n) => n.done).length;
  const selected = selectedKey ? graph.byKey.get(selectedKey) : null;

  function canToggle(node: OpsPipelineNode): boolean {
    if (statuses.get(node.key) === "blocked" && !node.done) return false;
    if (isCeo) return true;
    return !!node.owner_email && node.owner_email.toLowerCase() === currentEmail.toLowerCase();
  }

  async function toggle(node: OpsPipelineNode) {
    const nextDone = !node.done;
    // Name the consequence before the request so the flash is truthful even if
    // the notification itself later fails.
    const willUnlock = nextDone ? wouldUnlock(graph, node.key) : [];

    setBusyKey(node.key);
    setFlash(null);
    const res = await fetch(`/ops/api/pipeline/${node.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: nextDone }),
    });
    const d = await res.json().catch(() => ({}));
    setBusyKey(null);

    if (!res.ok) {
      setFlash({ tone: "error", text: d.error ?? "Could not update that node" });
      return;
    }

    if (Array.isArray(d.nodes)) setNodes(d.nodes as OpsPipelineNode[]);
    else setNodes((prev) => prev.map((n) => (n.id === node.id ? (d.node as OpsPipelineNode) : n)));

    if (!nextDone) {
      setFlash({ tone: "warn", text: `Reopened "${node.title}".` });
      return;
    }
    if (willUnlock.length === 0) {
      setFlash({ tone: "ok", text: `"${node.title}" done. Nothing new unlocked.` });
      return;
    }

    const who = [...new Set(willUnlock.map((n) => nameFor(n.owner_email)))].join(", ");
    const notified = typeof d.notified === "string" ? d.notified : null;
    if (notified === "sent") {
      setFlash({
        tone: "ok",
        text: `Unlocked ${willUnlock.length} task(s) for ${who}. Discord notified.`,
      });
    } else if (notified === "not_configured") {
      setFlash({
        tone: "warn",
        text: `Unlocked ${willUnlock.length} task(s) for ${who}. Discord webhook not configured — tell them yourself.`,
      });
    } else {
      setFlash({
        tone: "warn",
        text: `Unlocked ${willUnlock.length} task(s) for ${who}, but the Discord ping failed. Tell them yourself.`,
      });
    }
  }

  async function assignOwner(node: OpsPipelineNode, email: string) {
    setBusyKey(node.key);
    const res = await fetch(`/ops/api/pipeline/${node.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ owner_email: email }),
    });
    const d = await res.json().catch(() => ({}));
    setBusyKey(null);
    if (!res.ok) return setFlash({ tone: "error", text: d.error ?? "Could not reassign" });
    setNodes((prev) => prev.map((n) => (n.id === node.id ? (d.node as OpsPipelineNode) : n)));
  }

  async function removeNode(node: OpsPipelineNode) {
    if (!confirm(`Delete "${node.title}"? Its dependents will be released.`)) return;
    setBusyKey(node.key);
    const res = await fetch(`/ops/api/pipeline/${node.id}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    setBusyKey(null);
    if (!res.ok) return setFlash({ tone: "error", text: d.error ?? "Could not delete" });
    setNodes((prev) => prev.filter((n) => n.id !== node.id));
    setEdges((prev) => prev.filter((e) => e.from_key !== node.key && e.to_key !== node.key));
    if (selectedKey === node.key) setSelectedKey(null);
  }

  return (
    <section id="pipeline" className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-ink">Delivery pipeline</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {doneCount} of {nodes.length} done · a task unlocks only when everything it
            depends on is ticked
          </p>
        </div>
        {isCeo && (
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="rounded-lg gradient-bg px-4 py-2 text-sm text-white"
          >
            {showAdd ? "Close" : "Add task"}
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tracks.map((t) => (
          <div key={t.track} className="rounded-xl border border-border p-3">
            <p className="text-[11px] uppercase tracking-wide text-ink-muted">{t.track}</p>
            <p className="mt-1 font-display text-lg text-ink">
              {t.done}/{t.total}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-blush-surface">
              <div
                className="h-full rounded-full bg-racing-green"
                style={{ width: `${t.total ? (t.done / t.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {flash && (
        <p
          className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            flash.tone === "ok"
              ? "border-racing-green/40 bg-racing-green/5 text-racing-green"
              : flash.tone === "warn"
                ? "border-blush-border bg-blush-surface text-ink-secondary"
                : "border-deep-rose/40 bg-deep-rose/5 text-deep-rose"
          }`}
        >
          {flash.text}
        </p>
      )}

      {isCeo && showAdd && (
        <AddNodeForm
          founders={founders}
          nodes={nodes}
          onCreated={(node, newEdges) => {
            setNodes((prev) => [...prev, node]);
            setEdges((prev) => [...prev, ...newEdges]);
            setShowAdd(false);
            setFlash({ tone: "ok", text: `Added "${node.title}".` });
          }}
          onError={(text) => setFlash({ tone: "error", text })}
        />
      )}

      <div className="mt-5">
        <PipelineGraph
          graph={graph}
          statuses={statuses}
          ownerName={nameFor}
          canToggle={canToggle}
          busyKey={busyKey}
          onToggle={toggle}
          onSelect={(key) => setSelectedKey((prev) => (prev === key ? null : key))}
          selectedKey={selectedKey}
        />
      </div>

      {selected && (
        <NodeDetail
          node={selected}
          blockers={blockedBy(graph, selected.key)}
          unlocks={wouldUnlock(graph, selected.key)}
          ownerName={nameFor}
          founders={founders}
          isCeo={isCeo}
          busy={busyKey === selected.key}
          onAssign={(email) => assignOwner(selected, email)}
          onDelete={() => removeNode(selected)}
          onClose={() => setSelectedKey(null)}
        />
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Finish these next
          </h3>
          <p className="mt-1 text-xs text-ink-muted">
            Ready now, ordered by how much they unblock.
          </p>
          <ul className="mt-2 space-y-2">
            {tops.map(({ node, downstream }) => (
              <li
                key={node.key}
                className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">{node.title}</span>
                  <span className="text-xs text-ink-muted">{nameFor(node.owner_email)}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-racing-green">
                  frees {downstream}
                </span>
              </li>
            ))}
            {tops.length === 0 && (
              <p className="text-sm text-ink-muted">Nothing is ready — everything is done or blocked.</p>
            )}
          </ul>

          {path.length > 0 && (
            <p className="mt-3 text-xs text-ink-muted">
              Longest remaining chain: <strong className="text-ink">{path.length}</strong>{" "}
              sequential handoff(s) — {path.map((n) => n.title).join(" → ")}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            By person
          </h3>
          <p className="mt-1 text-xs text-ink-muted">
            Cycle time counts from when a task became startable, not when it was created.
          </p>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="pb-1 font-medium">Person</th>
                <th className="pb-1 text-right font-medium">Done</th>
                <th className="pb-1 text-right font-medium">Ready</th>
                <th className="pb-1 text-right font-medium">Blocking</th>
                <th className="pb-1 text-right font-medium">Avg</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.email || "unassigned"} className="border-t border-border">
                  <td className="py-1.5 text-ink">{nameFor(s.email || null)}</td>
                  <td className="py-1.5 text-right text-ink-secondary">
                    {s.done}/{s.total}
                  </td>
                  <td className="py-1.5 text-right text-ink-secondary">{s.ready}</td>
                  <td
                    className={`py-1.5 text-right ${
                      s.blocking > 0 ? "font-medium text-deep-rose" : "text-ink-secondary"
                    }`}
                  >
                    {s.blocking}
                  </td>
                  <td className="py-1.5 text-right text-ink-secondary">
                    {s.avgCycleHours === null ? "—" : `${s.avgCycleHours.toFixed(1)}h`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function NodeDetail({
  node,
  blockers,
  unlocks,
  ownerName,
  founders,
  isCeo,
  busy,
  onAssign,
  onDelete,
  onClose,
}: {
  node: OpsPipelineNode;
  blockers: OpsPipelineNode[];
  unlocks: OpsPipelineNode[];
  ownerName: (email: string | null) => string;
  founders: Founder[];
  isCeo: boolean;
  busy: boolean;
  onAssign: (email: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-4 rounded-xl border border-blush-border bg-blush-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base text-ink">{node.title}</h3>
        <button onClick={onClose} className="shrink-0 text-xs text-ink-muted hover:text-ink">
          Close
        </button>
      </div>

      {node.dod && (
        <p className="mt-2 text-sm text-ink">
          <span className="font-semibold">Done when:</span> {node.dod}
        </p>
      )}
      {node.detail && <p className="mt-2 text-xs text-ink-secondary">{node.detail}</p>}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Waiting on
          </p>
          {blockers.length === 0 ? (
            <p className="text-sm text-ink-secondary">Nothing — this is startable.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {blockers.map((b) => (
                <li key={b.key} className="text-sm text-ink">
                  {b.title}{" "}
                  <span className="text-xs text-ink-muted">({ownerName(b.owner_email)})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Ticking this unlocks
          </p>
          {unlocks.length === 0 ? (
            <p className="text-sm text-ink-secondary">Nothing immediately.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {unlocks.map((u) => (
                <li key={u.key} className="text-sm text-ink">
                  {u.title}{" "}
                  <span className="text-xs text-ink-muted">({ownerName(u.owner_email)})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {isCeo && (
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="text-xs text-ink-secondary">
            Owner
            <select
              value={node.owner_email ?? ""}
              disabled={busy}
              onChange={(e) => onAssign(e.target.value)}
              className="mt-1 block rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
            >
              <option value="">Unassigned</option>
              {founders.map((f) => (
                <option key={f.email} value={f.email}>
                  {f.name || f.email}
                  {f.role ? ` · ${f.role}` : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={onDelete}
            disabled={busy}
            className="ml-auto text-xs text-ink-muted hover:text-deep-rose disabled:opacity-60"
          >
            Delete task
          </button>
        </div>
      )}
    </div>
  );
}

function AddNodeForm({
  founders,
  nodes,
  onCreated,
  onError,
}: {
  founders: Founder[];
  nodes: OpsPipelineNode[];
  onCreated: (node: OpsPipelineNode, edges: OpsPipelineEdge[]) => void;
  onError: (text: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [dod, setDod] = useState("");
  const [track, setTrack] = useState<PipelineTrack>("frontend");
  const [owner, setOwner] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Slug derived from the title so the CEO never has to invent a key, but it
  // stays stable afterwards because seeds and edges reference it.
  const key = useMemo(
    () =>
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60),
    [title]
  );

  async function submit() {
    if (!title.trim()) return onError("Give the task a title");
    if (!key) return onError("Title must contain letters or numbers");
    setSaving(true);
    const res = await fetch("/ops/api/pipeline", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        key,
        title: title.trim(),
        dod: dod.trim() || undefined,
        track,
        owner_email: owner || undefined,
        due_date: dueDate || undefined,
        depends_on: dependsOn,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok || !d.node) return onError(d.error ?? "Could not add the task");
    onCreated(
      d.node as OpsPipelineNode,
      dependsOn.map((from) => ({
        id: `${from}->${key}`,
        from_key: from,
        to_key: key,
        created_by: null,
        created_at: new Date().toISOString(),
      }))
    );
    setTitle("");
    setDod("");
    setDependsOn([]);
  }

  return (
    <div className="mt-4 rounded-xl border border-blush-border bg-blush-surface p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Add a task
      </p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task, e.g. Deploy worker + cron services"
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
      />
      <input
        value={dod}
        onChange={(e) => setDod(e.target.value)}
        placeholder="Done when… (the agreed condition for ticking it)"
        className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
      />
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="text-xs text-ink-secondary">
          Track
          <select
            value={track}
            onChange={(e) => setTrack(e.target.value as PipelineTrack)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
          >
            {PIPELINE_TRACKS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-secondary">
          Owner
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
          >
            <option value="">Unassigned</option>
            {founders.map((f) => (
              <option key={f.email} value={f.email}>
                {f.name || f.email}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-secondary">
          Due
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
          />
        </label>
      </div>

      <label className="mt-2 block text-xs text-ink-secondary">
        Depends on (hold ⌘/Ctrl to pick several)
        <select
          multiple
          value={dependsOn}
          onChange={(e) =>
            setDependsOn([...e.target.selectedOptions].map((o) => o.value))
          }
          className="mt-1 h-28 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
        >
          {nodes.map((n) => (
            <option key={n.key} value={n.key}>
              {n.title}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="truncate text-[11px] text-ink-muted">
          {key ? `key: ${key}` : "key will be derived from the title"}
        </span>
        <button
          onClick={submit}
          disabled={saving}
          className="shrink-0 rounded-lg gradient-bg px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add task"}
        </button>
      </div>
    </div>
  );
}
