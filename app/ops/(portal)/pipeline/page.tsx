// Delivery pipeline — its own tab rather than a dashboard section, because the
// graph needs the full page width to stay readable once the chain gets deep.
import { createSupabaseServerClient, getSessionEmail } from "@/lib/supabase/server";
import { getFounders } from "@/lib/ops/config";
import { isCeoEmail } from "@/lib/ops/env";
import type { OpsPipelineEdge, OpsPipelineNode } from "@/lib/ops/types";
import PipelinePanel from "@/components/ops/PipelinePanel";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = await createSupabaseServerClient();

  const [nodesRes, edgesRes, founders, email] = await Promise.all([
    supabase
      .from("ops_pipeline_nodes")
      .select("*")
      .is("deleted_at", null)
      .order("position", { ascending: true }),
    supabase.from("ops_pipeline_edges").select("*"),
    getFounders(),
    getSessionEmail(),
  ]);

  const nodes = (nodesRes.data ?? []) as unknown as OpsPipelineNode[];
  const edges = (edgesRes.data ?? []) as unknown as OpsPipelineEdge[];
  const currentEmail = email ?? "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ink">Delivery pipeline</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Work as a dependency graph. A task can only be ticked once everything it
          depends on is done, and completing one notifies whoever it unblocks.
        </p>
      </div>

      <PipelinePanel
        initialNodes={nodes}
        initialEdges={edges}
        founders={founders}
        isCeo={isCeoEmail(currentEmail)}
        currentEmail={currentEmail}
      />
    </div>
  );
}
