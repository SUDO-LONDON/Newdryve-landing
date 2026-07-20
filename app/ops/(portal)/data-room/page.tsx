import Link from "next/link";
import DataRoom, { type DataRoomDocument } from "@/components/ops/DataRoom";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DATA_ROOM_CATEGORIES } from "@/lib/ops/types";

export const dynamic = "force-dynamic";

const CURRENT_VERSION_SELECT =
  "*, current_version:ops_document_versions!ops_documents_current_version_fk(id, storage_path, version_label, size, mime, uploaded_by, uploaded_at)";

export default async function DataRoomPage() {
  const supabase = await createSupabaseServerClient();
  const { data: documents } = await supabase
    .from("ops_documents")
    .select(CURRENT_VERSION_SELECT)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  const docs = (documents ?? []) as unknown as DataRoomDocument[];
  const counts = docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.category] = (acc[d.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink">Data Room</h1>
        <p className="text-sm text-ink-secondary mt-0.5 max-w-2xl">
          Secure, founder-only document storage. Files are private and served only via short-lived
          signed links; every upload, download, rename, replace, delete and restore is audited.
        </p>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {DATA_ROOM_CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={`/ops/data-room/${c.id}`}
            className="rounded-xl border border-border bg-white p-4 hover:shadow-sm hover:border-blush-border transition"
          >
            <p className="text-sm font-medium text-ink">{c.name}</p>
            <p className="mt-1 text-xs text-ink-muted">{counts[c.id] ?? 0} documents</p>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 font-display text-lg text-ink">All documents</h2>
      <DataRoom initialDocuments={docs} />
    </div>
  );
}
