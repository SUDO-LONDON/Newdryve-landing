"use client";

import { useState } from "react";
import { DATA_ROOM_CATEGORIES } from "@/lib/ops/types";
import type { DataRoomDocument } from "@/components/ops/DataRoom";

const ALLOWED_EXTENSIONS = ["pdf", "docx", "xlsx", "pptx", "csv", "png", "jpg", "jpeg"];

function extensionOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i + 1).toLowerCase();
}

// Upload dialog, shared by two flows:
//  - mode "new": upload a brand-new document (or a new version, if the
//    name+category combination already exists — the API decides that).
//  - mode "replace": upload a new version of an existing document; category
//    and name are fixed to the target document.
export default function DataRoomUploadModal({
  mode,
  lockedCategory,
  existingDoc,
  onClose,
  onDone,
}: {
  mode: "new" | "replace";
  lockedCategory?: string;
  existingDoc?: DataRoomDocument;
  onClose: () => void;
  onDone: (doc: DataRoomDocument) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState(lockedCategory ?? DATA_ROOM_CATEGORIES[0]?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [confidential, setConfidential] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleFile(f: File | null) {
    setFile(f);
    if (f && mode === "new" && !name) setName(f.name);
  }

  async function submit() {
    if (!file) {
      setError("Choose a file to upload");
      return;
    }
    const ext = extensionOf(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type .${ext || "?"}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return;
    }
    if (mode === "new" && !category) {
      setError("Choose a category");
      return;
    }

    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);

    let res: Response;
    if (mode === "replace" && existingDoc) {
      res = await fetch(`/ops/api/documents/${existingDoc.id}`, { method: "PATCH", body: form });
    } else {
      form.set("category", category);
      if (name.trim()) form.set("name", name.trim());
      if (description.trim()) form.set("description", description.trim());
      form.set("confidential", confidential ? "true" : "false");
      res = await fetch("/ops/api/documents", { method: "POST", body: form });
    }

    const d = await res.json();
    setBusy(false);
    if (d.document) onDone(d.document);
    else setError(d.error ?? "Upload failed");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-border p-5 shadow-xl">
        <h2 className="font-display text-xl text-ink mb-4">
          {mode === "replace" ? `Replace — ${existingDoc?.name}` : "Upload document"}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">File</label>
            <input
              type="file"
              accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Allowed: {ALLOWED_EXTENSIONS.join(", ")}
            </p>
          </div>

          {mode === "new" && (
            <>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Category</label>
                <select
                  value={category}
                  disabled={!!lockedCategory}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:opacity-60"
                >
                  {DATA_ROOM_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Defaults to the file name"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Uploading the same name in this category adds a new version instead of a new document.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm min-h-[70px]"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-secondary">
                <input
                  type="checkbox"
                  checked={confidential}
                  onChange={(e) => setConfidential(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Confidential
              </label>
            </>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-deep-rose">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-ink hover:bg-blush-surface"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="rounded-lg gradient-bg px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {busy ? "Uploading…" : mode === "replace" ? "Upload version" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
