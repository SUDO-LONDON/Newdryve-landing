// Pure graph logic for the delivery pipeline. No I/O and no React, so the
// unlock rules can be reasoned about (and tested) in one place rather than
// being re-derived in the API route and again in the renderer.

import type {
  NodeStatus,
  OpsPipelineEdge,
  OpsPipelineNode,
  PipelineTrack,
} from "@/lib/ops/types";

export interface PipelineGraph {
  nodes: OpsPipelineNode[];
  byKey: Map<string, OpsPipelineNode>;
  /** key -> prerequisite keys */
  prereqs: Map<string, string[]>;
  /** key -> dependent keys */
  dependents: Map<string, string[]>;
}

export function buildGraph(
  nodes: OpsPipelineNode[],
  edges: OpsPipelineEdge[]
): PipelineGraph {
  const live = nodes.filter((n) => !n.deleted_at);
  const byKey = new Map(live.map((n) => [n.key, n]));
  const prereqs = new Map<string, string[]>();
  const dependents = new Map<string, string[]>();

  for (const n of live) {
    prereqs.set(n.key, []);
    dependents.set(n.key, []);
  }
  for (const e of edges) {
    // Skip edges pointing at nodes that no longer exist.
    if (!byKey.has(e.from_key) || !byKey.has(e.to_key)) continue;
    prereqs.get(e.to_key)!.push(e.from_key);
    dependents.get(e.from_key)!.push(e.to_key);
  }

  return { nodes: live, byKey, prereqs, dependents };
}

/**
 * A node is READY only when every prerequisite is done. This mirrors
 * ops_pipeline_is_unlocked() in Postgres — the database is the enforcement
 * point, this is the display of the same rule.
 */
export function statusOf(graph: PipelineGraph, key: string): NodeStatus {
  const node = graph.byKey.get(key);
  if (!node) return "blocked";
  if (node.done) return "done";
  const blocked = (graph.prereqs.get(key) ?? []).some(
    (p) => !graph.byKey.get(p)?.done
  );
  return blocked ? "blocked" : "ready";
}

export function statusMap(graph: PipelineGraph): Map<string, NodeStatus> {
  return new Map(graph.nodes.map((n) => [n.key, statusOf(graph, n.key)]));
}

/** Prerequisites of `key` that are not yet done — i.e. what is holding it up. */
export function blockedBy(graph: PipelineGraph, key: string): OpsPipelineNode[] {
  return (graph.prereqs.get(key) ?? [])
    .map((k) => graph.byKey.get(k))
    .filter((n): n is OpsPipelineNode => !!n && !n.done);
}

/**
 * Which nodes become READY if `key` is completed. This is the notification
 * payload: the people to ping and the work that just opened up.
 *
 * Evaluated against a hypothetical graph where `key` is done, so it answers
 * "what would this unlock" before the write as well as after it.
 */
export function wouldUnlock(graph: PipelineGraph, key: string): OpsPipelineNode[] {
  const out: OpsPipelineNode[] = [];
  for (const depKey of graph.dependents.get(key) ?? []) {
    const dep = graph.byKey.get(depKey);
    if (!dep || dep.done) continue;
    const stillBlocked = (graph.prereqs.get(depKey) ?? []).some(
      (p) => p !== key && !graph.byKey.get(p)?.done
    );
    if (!stillBlocked) out.push(dep);
  }
  return out;
}

/**
 * Longest-path depth from any root. Used as the column index in the rendered
 * graph so every edge points strictly left-to-right and never backwards.
 */
export function depthMap(graph: PipelineGraph): Map<string, number> {
  const depth = new Map<string, number>();
  const visiting = new Set<string>();

  const walk = (key: string): number => {
    const cached = depth.get(key);
    if (cached !== undefined) return cached;
    // Cycles are rejected at write time; this guard only stops a malformed
    // payload from hanging the renderer.
    if (visiting.has(key)) return 0;
    visiting.add(key);
    const ps = graph.prereqs.get(key) ?? [];
    const d = ps.length === 0 ? 0 : Math.max(...ps.map(walk)) + 1;
    visiting.delete(key);
    depth.set(key, d);
    return d;
  };

  for (const n of graph.nodes) walk(n.key);
  return depth;
}

/** Nodes grouped into columns by depth, ordered within a column. */
export function columns(graph: PipelineGraph): OpsPipelineNode[][] {
  const depth = depthMap(graph);
  const maxDepth = Math.max(0, ...[...depth.values()]);
  const cols: OpsPipelineNode[][] = Array.from({ length: maxDepth + 1 }, () => []);
  for (const n of graph.nodes) cols[depth.get(n.key) ?? 0].push(n);
  for (const col of cols) {
    col.sort(
      (a, b) =>
        a.track.localeCompare(b.track) ||
        a.position - b.position ||
        a.title.localeCompare(b.title)
    );
  }
  return cols;
}

/**
 * How many not-yet-done nodes sit downstream of `key` (transitively). The
 * honest measure of "how much is waiting on this person right now".
 */
export function downstreamCount(graph: PipelineGraph, key: string): number {
  const seen = new Set<string>();
  const stack = [...(graph.dependents.get(key) ?? [])];
  while (stack.length) {
    const k = stack.pop()!;
    if (seen.has(k)) continue;
    seen.add(k);
    stack.push(...(graph.dependents.get(k) ?? []));
  }
  let n = 0;
  for (const k of seen) if (!graph.byKey.get(k)?.done) n += 1;
  return n;
}

export interface Bottleneck {
  node: OpsPipelineNode;
  downstream: number;
}

/**
 * Ready-but-unfinished nodes, worst first. The top entry is the single thing
 * most worth finishing next, because it frees the most downstream work.
 */
export function bottlenecks(graph: PipelineGraph): Bottleneck[] {
  return graph.nodes
    .filter((n) => statusOf(graph, n.key) === "ready")
    .map((node) => ({ node, downstream: downstreamCount(graph, node.key) }))
    .sort((a, b) => b.downstream - a.downstream || a.node.title.localeCompare(b.node.title));
}

/**
 * The longest chain of incomplete work. Its length is the minimum number of
 * sequential handoffs left, regardless of how many people are available.
 */
export function criticalPath(graph: PipelineGraph): OpsPipelineNode[] {
  const memo = new Map<string, OpsPipelineNode[]>();

  const walk = (key: string): OpsPipelineNode[] => {
    const cached = memo.get(key);
    if (cached) return cached;
    const node = graph.byKey.get(key);
    if (!node || node.done) {
      memo.set(key, []);
      return [];
    }
    let best: OpsPipelineNode[] = [];
    for (const dep of graph.dependents.get(key) ?? []) {
      const path = walk(dep);
      if (path.length > best.length) best = path;
    }
    const result = [node, ...best];
    memo.set(key, result);
    return result;
  };

  let longest: OpsPipelineNode[] = [];
  for (const n of graph.nodes) {
    if (n.done) continue;
    const path = walk(n.key);
    if (path.length > longest.length) longest = path;
  }
  return longest;
}

export interface OwnerStats {
  email: string;
  total: number;
  done: number;
  ready: number;
  blocked: number;
  /** Currently blocking this many downstream items. */
  blocking: number;
  /** Mean hours from "could start" to "done". Null until something completes. */
  avgCycleHours: number | null;
}

/**
 * Per-person delivery stats. Cycle time is measured from unlocked_at, not
 * created_at: time a node spent waiting on someone else is not the owner's.
 */
export function ownerStats(graph: PipelineGraph): OwnerStats[] {
  const byOwner = new Map<string, OpsPipelineNode[]>();
  for (const n of graph.nodes) {
    const key = (n.owner_email ?? "").toLowerCase();
    const list = byOwner.get(key) ?? [];
    list.push(n);
    byOwner.set(key, list);
  }

  const out: OwnerStats[] = [];
  for (const [email, nodes] of byOwner) {
    const cycles: number[] = [];
    let ready = 0;
    let blocked = 0;
    let blocking = 0;

    for (const n of nodes) {
      const status = statusOf(graph, n.key);
      if (status === "ready") {
        ready += 1;
        blocking += downstreamCount(graph, n.key);
      }
      if (status === "blocked") blocked += 1;
      if (n.done && n.done_at && n.unlocked_at) {
        const ms = new Date(n.done_at).getTime() - new Date(n.unlocked_at).getTime();
        if (Number.isFinite(ms) && ms >= 0) cycles.push(ms / 3_600_000);
      }
    }

    out.push({
      email,
      total: nodes.length,
      done: nodes.filter((n) => n.done).length,
      ready,
      blocked,
      blocking,
      avgCycleHours: cycles.length
        ? cycles.reduce((a, b) => a + b, 0) / cycles.length
        : null,
    });
  }

  return out.sort((a, b) => b.blocking - a.blocking || a.email.localeCompare(b.email));
}

export interface TrackProgress {
  track: PipelineTrack;
  total: number;
  done: number;
}

export function trackProgress(graph: PipelineGraph): TrackProgress[] {
  const map = new Map<PipelineTrack, TrackProgress>();
  for (const n of graph.nodes) {
    const entry = map.get(n.track) ?? { track: n.track, total: 0, done: 0 };
    entry.total += 1;
    if (n.done) entry.done += 1;
    map.set(n.track, entry);
  }
  return [...map.values()].sort((a, b) => a.track.localeCompare(b.track));
}
