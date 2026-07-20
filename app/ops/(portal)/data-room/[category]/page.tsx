import Link from "next/link";
import { notFound } from "next/navigation";
import DataRoom, { type DataRoomDocument } from "@/components/ops/DataRoom";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DATA_ROOM_CATEGORIES } from "@/lib/ops/types";

export const dynamic = "force-dynamic";

const CURRENT_VERSION_SELECT =
  "*, current_version:ops_document_versions!ops_documents_current_version_fk(id, storage_path, version_label, size, mime, uploaded_by, uploaded_at)";

export default async function DataRoomCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = DATA_ROOM_CATEGORIES.find((c) => c.id === category);
  if (!cat) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: documents } = await supabase
    .from("ops_documents")
    .select(CURRENT_VERSION_SELECT)
    .eq("category", category)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (
    <div>
      <p className="mb-1">
        <Link href="/ops/data-room" className="text-sm text-racing-green hover:underline">
          ← Data Room
        </Link>
      </p>
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink">{cat.name}</h1>
      </header>

      <DataRoom initialDocuments={(documents ?? []) as unknown as DataRoomDocument[]} lockedCategory={category} />
    </div>
  );
}
