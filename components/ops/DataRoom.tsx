"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { DATA_ROOM_CATEGORIES } from "@/lib/ops/types";
import DataRoomUploadModal from "@/components/ops/DataRoomUploadModal";

export interface DataRoomVersion {
  id: string;
  document_id?: string;
  storage_path?: string;
  version_label: string | null;
  size: number | null;
  mime: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface DataRoomDocument {
  id: string;
  category: string;
  name: string;
  description: string | null;
  confidential: boolean;
  current_version_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  current_version: DataRoomVersion | null;
}

function categoryName(id: string): string {
  return DATA_ROOM_CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default function DataRoom({
  initialDocuments,
  lockedCategory,
}: {
  initialDocuments: DataRoomDocument[];
  lockedCategory?: string;
}) {
  const [documents, setDocuments] = useState<DataRoomDocument[]>(initialDocuments);
  const [query, setQuery] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<DataRoomDocument | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<string, DataRoomVersion[]>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; description: string; confidential: boolean }>({
    name: "",
    description: "",
    confidential: false,
  });
  const [busyId, setBusyId] = useState<string | null>(null);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => refresh(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, showDeleted]);

  async function refresh() {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (lockedCategory) params.set("category", lockedCategory);
    if (showDeleted) params.set("include_deleted", "1");
    const res = await fetch(`/ops/api/documents?${params.toString()}`);
    const d = await res.json();
    setLoading(false);
    if (d.documents) {
      setDocuments(showDeleted ? d.documents.filter((doc: DataRoomDocument) => doc.deleted_at) : d.documents);
    }
  }

  async function toggleExpand(id: string) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!versions[id]) {
      const res = await fetch(`/ops/api/documents/${id}`);
      const d = await res.json();
      if (d.versions) setVersions((v) => ({ ...v, [id]: d.versions }));
    }
  }

  function startEdit(doc: DataRoomDocument) {
    setEditingId(doc.id);
    setEditValues({ name: doc.name, description: doc.description ?? "", confidential: doc.confidential });
  }

  async function saveEdit(id: string) {
    setBusyId(id);
    const res = await fetch(`/ops/api/documents/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(editValues),
    });
    const d = await res.json();
    setBusyId(null);
    if (d.document) {
      setDocuments((prev) => prev.map((doc) => (doc.id === id ? d.document : doc)));
      setEditingId(null);
    } else {
      alert(d.error ?? "Failed to save changes");
    }
  }

  async function downloadDoc(doc: DataRoomDocument) {
    if (!doc.current_version) return;
    setBusyId(doc.id);
    const res = await fetch("/ops/api/documents/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ version_id: doc.current_version.id }),
    });
    const d = await res.json();
    setBusyId(null);
    if (d.url) window.open(d.url, "_blank", "noopener,noreferrer");
    else alert(d.error ?? "Failed to generate download link");
  }

  async function downloadVersion(versionId: string) {
    const res = await fetch("/ops/api/documents/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ version_id: versionId }),
    });
    const d = await res.json();
    if (d.url) window.open(d.url, "_blank", "noopener,noreferrer");
    else alert(d.error ?? "Failed to generate download link");
  }

  async function deleteDoc(doc: DataRoomDocument) {
    if (!confirm(`Move "${doc.name}" to deleted? It can be restored later.`)) return;
    setBusyId(doc.id);
    const res = await fetch(`/ops/api/documents/${doc.id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) {
      if (showDeleted) refresh();
      else setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    }
  }

  async function restoreDoc(doc: DataRoomDocument) {
    setBusyId(doc.id);
    const res = await fetch(`/ops/api/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ restore: true }),
    });
    setBusyId(null);
    if (res.ok) refresh();
  }

  function onUploaded(doc: DataRoomDocument) {
    setUploadOpen(false);
    setReplaceTarget(null);
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === doc.id);
      return exists ? prev.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...prev];
    });
    setVersions((v) => {
      const rest = { ...v };
      delete rest[doc.id];
      return rest;
    });
  }

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents…"
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <label className="flex items-center gap-1.5 text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Show deleted
          </label>
          {loading && <span className="text-xs text-ink-muted">Loading…</span>}
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="rounded-lg gradient-bg px-3 py-1.5 text-sm text-white"
        >
          + Upload
        </button>
      </header>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-ink-secondary">
              <th className="px-3 py-2 font-medium">Name</th>
              {!lockedCategory && <th className="px-3 py-2 font-medium">Category</th>}
              <th className="px-3 py-2 font-medium">Version</th>
              <th className="px-3 py-2 font-medium">Size</th>
              <th className="px-3 py-2 font-medium">Updated</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <Fragment key={doc.id}>
                <tr className="border-b border-border/60 hover:bg-blush-surface/40 align-top">
                  <td className="px-3 py-2">
                    {editingId === doc.id ? (
                      <div className="space-y-1.5">
                        <input
                          value={editValues.name}
                          onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                          className="w-full rounded border border-border px-2 py-1 text-sm"
                        />
                        <textarea
                          value={editValues.description}
                          onChange={(e) => setEditValues((v) => ({ ...v, description: e.target.value }))}
                          placeholder="Description…"
                          className="w-full rounded border border-border px-2 py-1 text-sm min-h-[50px]"
                        />
                        <label className="flex items-center gap-1.5 text-xs text-ink-secondary">
                          <input
                            type="checkbox"
                            checked={editValues.confidential}
                            onChange={(e) => setEditValues((v) => ({ ...v, confidential: e.target.checked }))}
                            className="h-3.5 w-3.5 rounded border-border"
                          />
                          Confidential
                        </label>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpand(doc.id)}
                            className="font-medium text-ink hover:underline text-left"
                          >
                            {doc.name}
                          </button>
                          {doc.confidential && (
                            <span className="rounded bg-blush-surface border border-blush-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-deep-rose">
                              Confidential
                            </span>
                          )}
                          {doc.deleted_at && (
                            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-muted">
                              Deleted
                            </span>
                          )}
                        </div>
                        {doc.description && (
                          <p className="mt-0.5 text-xs text-ink-secondary max-w-md">{doc.description}</p>
                        )}
                      </div>
                    )}
                  </td>
                  {!lockedCategory && (
                    <td className="px-3 py-2 text-ink-secondary whitespace-nowrap">{categoryName(doc.category)}</td>
                  )}
                  <td className="px-3 py-2 text-ink-secondary whitespace-nowrap">
                    {doc.current_version?.version_label ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-ink-secondary whitespace-nowrap">
                    {formatBytes(doc.current_version?.size ?? null)}
                  </td>
                  <td className="px-3 py-2 text-ink-secondary whitespace-nowrap">{formatDate(doc.updated_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {editingId === doc.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(doc.id)}
                            disabled={busyId === doc.id}
                            className="rounded border border-border px-2 py-1 text-xs text-white bg-racing-green disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded border border-border px-2 py-1 text-xs text-ink"
                          >
                            Cancel
                          </button>
                        </>
                      ) : doc.deleted_at ? (
                        <button
                          onClick={() => restoreDoc(doc)}
                          disabled={busyId === doc.id}
                          className="rounded border border-border px-2 py-1 text-xs text-racing-green disabled:opacity-60"
                        >
                          Restore
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => downloadDoc(doc)}
                            disabled={!doc.current_version || busyId === doc.id}
                            className="rounded border border-border px-2 py-1 text-xs text-ink hover:bg-blush-surface disabled:opacity-60"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => setReplaceTarget(doc)}
                            className="rounded border border-border px-2 py-1 text-xs text-ink hover:bg-blush-surface"
                          >
                            Replace
                          </button>
                          <button
                            onClick={() => startEdit(doc)}
                            className="rounded border border-border px-2 py-1 text-xs text-ink hover:bg-blush-surface"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteDoc(doc)}
                            disabled={busyId === doc.id}
                            className="rounded border border-border px-2 py-1 text-xs text-deep-rose hover:bg-blush-surface disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {expanded === doc.id && (
                  <tr className="border-b border-border/60 bg-blush-surface/30">
                    <td colSpan={lockedCategory ? 5 : 6} className="px-3 py-3">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Version history
                      </p>
                      {!versions[doc.id] ? (
                        <p className="text-xs text-ink-muted">Loading…</p>
                      ) : versions[doc.id].length === 0 ? (
                        <p className="text-xs text-ink-muted">No versions.</p>
                      ) : (
                        <ul className="space-y-1">
                          {versions[doc.id].map((v) => (
                            <li key={v.id} className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
                              <span className="font-medium text-ink">{v.version_label ?? "—"}</span>
                              <span>{formatBytes(v.size)}</span>
                              <span>{v.uploaded_by ?? "—"}</span>
                              <span>{formatDate(v.uploaded_at)}</span>
                              {v.id === doc.current_version_id && (
                                <span className="rounded bg-white border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                                  Current
                                </span>
                              )}
                              <button
                                onClick={() => downloadVersion(v.id)}
                                className="rounded border border-border px-2 py-0.5 text-ink hover:bg-white"
                              >
                                Download
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={lockedCategory ? 5 : 6} className="px-3 py-8 text-center text-ink-muted">
                  No documents.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {uploadOpen && (
        <DataRoomUploadModal
          mode="new"
          lockedCategory={lockedCategory}
          onClose={() => setUploadOpen(false)}
          onDone={onUploaded}
        />
      )}
      {replaceTarget && (
        <DataRoomUploadModal
          mode="replace"
          existingDoc={replaceTarget}
          onClose={() => setReplaceTarget(null)}
          onDone={onUploaded}
        />
      )}
    </div>
  );
}
