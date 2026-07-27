import { NextResponse, type NextRequest } from "next/server";
import { isGuardError, requireCeo } from "@/lib/ops/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/ops/audit";

// POST /ops/api/pipeline/edges  { from_key, to_key } — CEO only.
// from_key must be finished before to_key can start.
export async function POST(req: NextRequest) {
  const guard = await requireCeo();
  if (isGuardError(guard)) return guard.error;

  const body = await req.json().catch(() => null);
  const fromKey = String(body?.from_key ?? "").trim().toLowerCase();
  const toKey = String(body?.to_key ?? "").trim().toLowerCase();

  if (!fromKey || !toKey) {
    return NextResponse.json({ error: "from_key and to_key are required" }, { status: 400 });
  }
  if (fromKey === toKey) {
    return NextResponse.json({ error: "a node cannot depend on itself" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: edge, error } = await supabase
    .from("ops_pipeline_edges")
    .insert({ from_key: fromKey, to_key: toKey, created_by: guard.email })
    .select("*")
    .single();

  if (error) {
    // 23505 duplicate, 23503 unknown node, P0001 the cycle guard raising.
    const status = error.code === "23505" ? 409 : error.code === "23503" ? 404 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  await logAudit({
    actor_email: guard.email,
    action: "create",
    target_type: "pipeline_edge",
    target_id: edge.id as string,
    detail: { from_key: fromKey, to_key: toKey },
  });

  return NextResponse.json({ edge });
}

// DELETE /ops/api/pipeline/edges?from=<key>&to=<key> — CEO only.
export async function DELETE(req: NextRequest) {
  const guard = await requireCeo();
  if (isGuardError(guard)) return guard.error;

  const fromKey = req.nextUrl.searchParams.get("from")?.trim().toLowerCase();
  const toKey = req.nextUrl.searchParams.get("to")?.trim().toLowerCase();
  if (!fromKey || !toKey) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("ops_pipeline_edges")
    .delete()
    .eq("from_key", fromKey)
    .eq("to_key", toKey);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actor_email: guard.email,
    action: "delete",
    target_type: "pipeline_edge",
    detail: { from_key: fromKey, to_key: toKey },
  });

  return NextResponse.json({ ok: true });
}
