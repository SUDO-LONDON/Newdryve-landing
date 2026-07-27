"use client";

// Renders the delivery pipeline as a left-to-right dependency graph.
//
// Layout is computed, not measured: every card is a fixed size and its position
// is a pure function of (depth column, row). That keeps the SVG edge geometry
// exact without ResizeObserver bookkeeping, and makes the whole thing render
// identically on the server-provided first paint.

import { useMemo } from "react";
import type { NodeStatus, OpsPipelineNode } from "@/lib/ops/types";
import { columns, type PipelineGraph as Graph } from "@/lib/ops/pipeline";

const CARD_W = 244;
const CARD_H = 128;
const COL_GAP = 76;
const ROW_GAP = 18;
const PAD = 8;

const TRACK_LABEL: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  cloud: "Cloud",
  ops: "Ops",
};

type Placed = { node: OpsPipelineNode; x: number; y: number };

export default function PipelineGraph({
  graph,
  statuses,
  ownerName,
  canToggle,
  busyKey,
  onToggle,
  onSelect,
  selectedKey,
}: {
  graph: Graph;
  statuses: Map<string, NodeStatus>;
  ownerName: (email: string | null) => string;
  canToggle: (node: OpsPipelineNode) => boolean;
  busyKey: string | null;
  onToggle: (node: OpsPipelineNode) => void;
  onSelect: (key: string) => void;
  selectedKey: string | null;
}) {
  const { placed, byKey, width, height } = useMemo(() => {
    const cols = columns(graph);
    const list: Placed[] = [];
    cols.forEach((col, ci) => {
      col.forEach((node, ri) => {
        list.push({
          node,
          x: PAD + ci * (CARD_W + COL_GAP),
          y: PAD + ri * (CARD_H + ROW_GAP),
        });
      });
    });
    const rows = Math.max(1, ...cols.map((c) => c.length));
    return {
      placed: list,
      byKey: new Map(list.map((p) => [p.node.key, p])),
      width: PAD * 2 + cols.length * CARD_W + Math.max(0, cols.length - 1) * COL_GAP,
      height: PAD * 2 + rows * CARD_H + Math.max(0, rows - 1) * ROW_GAP,
    };
  }, [graph]);

  // One path per edge, drawn behind the cards.
  const paths = useMemo(() => {
    const out: { d: string; done: boolean; key: string }[] = [];
    for (const [fromKey, deps] of graph.dependents) {
      const from = byKey.get(fromKey);
      if (!from) continue;
      for (const toKey of deps) {
        const to = byKey.get(toKey);
        if (!to) continue;
        const x1 = from.x + CARD_W;
        const y1 = from.y + CARD_H / 2;
        const x2 = to.x;
        const y2 = to.y + CARD_H / 2;
        const mid = Math.max(24, (x2 - x1) / 2);
        out.push({
          d: `M ${x1} ${y1} C ${x1 + mid} ${y1}, ${x2 - mid} ${y2}, ${x2} ${y2}`,
          done: !!graph.byKey.get(fromKey)?.done,
          key: `${fromKey}->${toKey}`,
        });
      }
    }
    return out;
  }, [graph, byKey]);

  if (placed.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        No pipeline nodes yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="relative" style={{ width, height, minWidth: width }}>
        <svg
          width={width}
          height={height}
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="pipe-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-border" />
            </marker>
            <marker
              id="pipe-arrow-done"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-racing-green" />
            </marker>
          </defs>
          {paths.map((p) => (
            <path
              key={p.key}
              d={p.d}
              fill="none"
              strokeWidth={p.done ? 2 : 1.5}
              strokeDasharray={p.done ? undefined : "5 4"}
              className={p.done ? "stroke-racing-green" : "stroke-border"}
              markerEnd={`url(#${p.done ? "pipe-arrow-done" : "pipe-arrow"})`}
            />
          ))}
        </svg>

        {placed.map(({ node, x, y }) => (
          <NodeCard
            key={node.key}
            node={node}
            x={x}
            y={y}
            status={statuses.get(node.key) ?? "blocked"}
            ownerName={ownerName}
            canToggle={canToggle(node)}
            busy={busyKey === node.key}
            onToggle={() => onToggle(node)}
            onSelect={() => onSelect(node.key)}
            selected={selectedKey === node.key}
            blockers={(graph.prereqs.get(node.key) ?? [])
              .map((k) => graph.byKey.get(k))
              .filter((n): n is OpsPipelineNode => !!n && !n.done)}
          />
        ))}
      </div>
    </div>
  );
}

function NodeCard({
  node,
  x,
  y,
  status,
  ownerName,
  canToggle,
  busy,
  onToggle,
  onSelect,
  selected,
  blockers,
}: {
  node: OpsPipelineNode;
  x: number;
  y: number;
  status: NodeStatus;
  ownerName: (email: string | null) => string;
  canToggle: boolean;
  busy: boolean;
  onToggle: () => void;
  onSelect: () => void;
  selected: boolean;
  blockers: OpsPipelineNode[];
}) {
  const shell =
    status === "done"
      ? "border-racing-green/40 bg-racing-green/5"
      : status === "ready"
        ? "border-racing-green bg-white shadow-sm"
        : "border-dashed border-border bg-blush-surface/50";

  const blockedTitle =
    status === "blocked" ? `Waiting on: ${blockers.map((b) => b.title).join(", ")}` : undefined;

  return (
    <div
      className={`absolute overflow-hidden rounded-xl border p-3 transition-shadow ${shell} ${
        selected ? "ring-2 ring-racing-green ring-offset-1" : ""
      }`}
      style={{ left: x, top: y, width: CARD_W, height: CARD_H }}
      title={blockedTitle}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={node.done}
            disabled={!canToggle || busy}
            onChange={onToggle}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={
              status === "blocked"
                ? `${node.title} — blocked`
                : `Mark "${node.title}" done`
            }
          />
          <button
            onClick={onSelect}
            className="min-w-0 flex-1 text-left"
            aria-expanded={selected}
          >
            <span
              className={`line-clamp-2 text-sm font-medium ${
                node.done ? "text-ink-muted line-through" : "text-ink"
              }`}
            >
              {node.title}
            </span>
          </button>
        </div>

        <div className="mt-auto space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-blush-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-secondary">
              {TRACK_LABEL[node.track] ?? node.track}
            </span>
            <StatusPill status={status} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[11px] text-ink-muted">
              {ownerName(node.owner_email)}
            </span>
            {node.due_date && (
              <span className="shrink-0 text-[11px] text-ink-muted">
                {new Date(`${node.due_date}T00:00:00Z`).toLocaleDateString("en-GB", {
                  weekday: "short",
                  timeZone: "UTC",
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: NodeStatus }) {
  if (status === "done") {
    return (
      <span className="rounded-full bg-racing-green px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        Done
      </span>
    );
  }
  if (status === "ready") {
    return (
      <span className="rounded-full border border-racing-green px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-racing-green">
        Ready
      </span>
    );
  }
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
      Blocked
    </span>
  );
}
