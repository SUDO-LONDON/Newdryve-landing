import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireCeo, requireFounder } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFounderEmail } from "@/lib/ops/env";
import { logAudit } from "@/lib/ops/audit";
import { PIPELINE_TRACKS, type PipelineTrack } from "@/lib/ops/types";

// GET /ops/api/pipeline — the whole graph. Founders see everything; the graph
// is only meaningful as a whole, so there is no per-owner filtering here.
export async function GET() {
  const guard = await requireFounder();
  if (isGuardError(guard)) return guard.error;

  const supabase = await createSupabaseServerClient();
  const [nodesRes, edgesRes] = await Promise.all([
    supabase
      .from("ops_pipeline_nodes")
      .select("*")
      .is("deleted_at", null)
      .order("position", { ascending: true }),
    supabase.from("ops_pipeline_edges").select("*"),
  ]);

  if (nodesRes.error) {
    return NextResponse.json({ error: nodesRes.error.message }, { status: 500 });
  }
  if (edgesRes.error) {
    return NextResponse.json({ error: edgesRes.error.message }, { status: 500 });
  }

  return NextResponse.json({ nodes: nodesRes.data ?? [], edges: edgesRes.data ?? [] });
}

// POST /ops/api/pipeline — create a node. CEO only.
// { key, title, detail?, dod?, track, owner_email?, due_date?, position?, depends_on?: string[] }
export async function POST(req: NextRequest) {
  const guard = await requireCeo();
  if (isGuardError(guard)) return guard.error;

  const body = await req.json().catch(() => null);
  const key = String(body?.key ?? "").trim().toLowerCase();
  const title = String(body?.title ?? "").trim();
  const track = String(body?.track ?? "ops").trim() as PipelineTrack;
  const detail = typeof body?.detail === "string" && body.detail.trim() ? body.detail.trim() : null;
  const dod = typeof body?.dod === "string" && body.dod.trim() ? body.dod.trim() : null;
  const dueDate = typeof body?.due_date === "string" && body.due_date.trim() ? body.due_date.trim() : null;
  const position = Number.isFinite(Number(body?.position)) ? Number(body.position) : 0;
  const dependsOn: string[] = Array.isArray(body?.depends_on)
    ? body.depends_on.map((k: unknown) => String(k).trim()).filter(Boolean)
    : [];

  const ownerRaw = typeof body?.owner_email === "string" ? body.owner_email.trim().toLowerCase() : "";
  const ownerEmail = ownerRaw || null;

  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(key)) {
    return NextResponse.json(
      { error: "key must be a lowercase slug, e.g. 'cloud-deploy-workers'" },
      { status: 400 }
    );
  }
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!PIPELINE_TRACKS.includes(track)) {
    return NextResponse.json({ error: `track must be one of ${PIPELINE_TRACKS.join(", ")}` }, { status: 400 });
  }
  if (ownerEmail && !isFounderEmail(ownerEmail)) {
    return NextResponse.json({ error: "owner_email must be an allowlisted founder" }, { status: 400 });
  }
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return NextResponse.json({ error: "due_date must be YYYY-MM-DD" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: node, error } = await supabase
    .from("ops_pipeline_nodes")
    .insert({
      key,
      title,
      detail,
      dod,
      track,
      owner_email: ownerEmail,
      due_date: dueDate,
      position,
      created_by: guard.email,
    })
    .select("*")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  // Dependencies are created after the node exists so the FK resolves. A cycle
  // is rejected by the database trigger and surfaced as a 409.
  if (dependsOn.length) {
    const { error: edgeErr } = await supabase.from("ops_pipeline_edges").insert(
      dependsOn.map((from) => ({ from_key: from, to_key: key, created_by: guard.email }))
    );
    if (edgeErr) {
      return NextResponse.json(
        { node, error: `node created, but dependencies failed: ${edgeErr.message}` },
        { status: 409 }
      );
    }
  }

  await logAudit({
    actor_email: guard.email,
    action: "create",
    target_type: "pipeline_node",
    target_id: node.id as string,
    detail: { key, title, track, depends_on: dependsOn },
  });

  return NextResponse.json({ node });
}
