import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireCeo, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isCeoEmail, isFounderEmail, OPS_BASE_URL } from "@/lib/ops/env";
import { logAudit } from "@/lib/ops/audit";
import { getFounders } from "@/lib/ops/config";
import { notifyUnlock } from "@/lib/ops/discord";
import { buildGraph, statusOf, wouldUnlock } from "@/lib/ops/pipeline";
import { PIPELINE_TRACKS } from "@/lib/ops/types";
import type { OpsPipelineEdge, OpsPipelineNode, PipelineTrack } from "@/lib/ops/types";

type Ctx = { params: Promise<{ id: string }> };

async function loadGraph(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const [nodesRes, edgesRes] = await Promise.all([
    supabase.from("ops_pipeline_nodes").select("*").is("deleted_at", null),
    supabase.from("ops_pipeline_edges").select("*"),
  ]);
  const nodes = (nodesRes.data ?? []) as unknown as OpsPipelineNode[];
  const edges = (edgesRes.data ?? []) as unknown as OpsPipelineEdge[];
  return { graph: buildGraph(nodes, edges), nodes, edges };
}

// PATCH /ops/api/pipeline/[id]
//   { done: boolean }  → tick/untick (CEO or the node's owner, if unlocked)
//   { title?, detail?, dod?, track?, owner_email?, due_date?, position? } → CEO
//
// Ticking is the event the whole feature exists for: it recomputes what has
// become startable and pings the owners of that newly-unblocked work.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { graph } = await loadGraph(supabase);

  const node = graph.nodes.find((n) => n.id === id);
  if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isCeo = isCeoEmail(guard.email);
  const isOwner =
    !!node.owner_email && node.owner_email.toLowerCase() === guard.email.toLowerCase();

  const wantsContentEdit =
    "title" in body ||
    "detail" in body ||
    "dod" in body ||
    "track" in body ||
    "owner_email" in body ||
    "due_date" in body ||
    "position" in body;
  const wantsDoneToggle = "done" in body;

  if (wantsContentEdit && !isCeo) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (wantsDoneToggle && !isCeo && !isOwner) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const update: Record<string, unknown> = {};
  const done = wantsDoneToggle ? Boolean(body.done) : node.done;

  if (wantsDoneToggle) {
    // Defence in depth: RLS refuses this too, but answering with a clear reason
    // beats surfacing an opaque row-level-security error in the UI.
    if (done && statusOf(graph, node.key) === "blocked") {
      const blockers = (graph.prereqs.get(node.key) ?? [])
        .map((k) => graph.byKey.get(k))
        .filter((n): n is OpsPipelineNode => !!n && !n.done)
        .map((n) => n.title);
      return NextResponse.json(
        { error: `blocked — finish first: ${blockers.join(", ")}` },
        { status: 409 }
      );
    }
    update.done = done;
    update.done_at = done ? new Date().toISOString() : null;
    update.done_by = done ? guard.email : null;
  }

  if (isCeo) {
    if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
    if ("detail" in body) {
      update.detail = typeof body.detail === "string" && body.detail.trim() ? body.detail.trim() : null;
    }
    if ("dod" in body) {
      update.dod = typeof body.dod === "string" && body.dod.trim() ? body.dod.trim() : null;
    }
    if (typeof body.track === "string" && PIPELINE_TRACKS.includes(body.track as PipelineTrack)) {
      update.track = body.track;
    }
    if ("owner_email" in body) {
      const owner = typeof body.owner_email === "string" ? body.owner_email.trim().toLowerCase() : "";
      if (owner && !isFounderEmail(owner)) {
        return NextResponse.json({ error: "owner_email must be an allowlisted founder" }, { status: 400 });
      }
      update.owner_email = owner || null;
    }
    if ("due_date" in body) {
      const due = typeof body.due_date === "string" ? body.due_date.trim() : "";
      if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
        return NextResponse.json({ error: "due_date must be YYYY-MM-DD" }, { status: 400 });
      }
      update.due_date = due || null;
    }
    if (Number.isFinite(Number(body.position))) update.position = Number(body.position);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  // Work out the unlock set BEFORE writing, against the pre-write graph. The
  // database trigger stamps unlocked_at itself; this is the notification list.
  const unlocked = wantsDoneToggle && done ? wouldUnlock(graph, node.key) : [];

  const { data: updated, error: updErr } = await supabase
    .from("ops_pipeline_nodes")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  if (wantsDoneToggle) {
    await supabase.from("ops_pipeline_events").insert({
      node_key: node.key,
      kind: done ? "completed" : "reopened",
      actor_email: guard.email,
      detail: { unlocked: unlocked.map((n) => n.key) },
    });
  }

  await logAudit({
    actor_email: guard.email,
    action: wantsDoneToggle && !wantsContentEdit ? "pipeline_toggle" : "update",
    target_type: "pipeline_node",
    target_id: id,
    detail: update,
  });

  // Notify. Best-effort: the tick already succeeded and must stand even if
  // Discord is down, so the outcome is recorded rather than thrown.
  let notified: string | null = null;
  if (unlocked.length > 0) {
    const founders = await getFounders().catch(() => []);
    const result = await notifyUnlock({
      completed: updated as unknown as OpsPipelineNode,
      unlocked,
      actorEmail: guard.email,
      founders,
      portalUrl: `${OPS_BASE_URL}/ops#pipeline`,
    });
    notified = result.ok ? (result.skipped ?? "sent") : `failed: ${result.error}`;
    await supabase.from("ops_pipeline_events").insert({
      node_key: node.key,
      kind: result.ok ? "notified" : "notify_failed",
      actor_email: guard.email,
      detail: { unlocked: unlocked.map((n) => n.key), outcome: notified },
    });
  }

  const { graph: after } = await loadGraph(supabase);
  return NextResponse.json({
    node: updated,
    nodes: after.nodes,
    unlocked: unlocked.map((n) => ({ key: n.key, title: n.title, owner_email: n.owner_email })),
    notified,
  });
}

// DELETE /ops/api/pipeline/[id] — CEO only (soft delete). Edges referencing the
// node stay put; the graph builder ignores edges whose endpoints are gone, so
// dependents are released rather than permanently blocked.
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await requireCeo();
  if (isGuardError(guard)) return guard.error;
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("ops_pipeline_nodes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actor_email: guard.email,
    action: "delete",
    target_type: "pipeline_node",
    target_id: id,
  });
  return NextResponse.json({ ok: true });
}
