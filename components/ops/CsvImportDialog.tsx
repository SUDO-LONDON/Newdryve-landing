"use client";

import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import type { OpsBoard, OpsField } from "@/lib/ops/types";

type Step = "upload" | "mapping" | "result";

const normalizeHeader = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ADI_COLUMNS = new Set(["sent", "response", "interested"]);

// "use client" modal for importing rows into a board from a CSV file. Flow:
// pick a file -> parse it locally with papaparse -> ask the server for a
// suggested column mapping -> let the founder confirm/adjust it and preview a
// few rows -> commit. Matches NewItemModal's overlay/panel styling in Board.tsx.
export default function CsvImportDialog({
  board,
  fields,
  onClose,
  onImported,
}: {
  board: OpsBoard;
  fields: OpsField[];
  onClose: () => void;
  onImported: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  const fieldByKey = useMemo(() => new Map(fields.map((f) => [f.key, f] as const)), [fields]);

  const showsAdiNote =
    board.id === "instructors" && headers.some((h) => ADI_COLUMNS.has(normalizeHeader(h)));

  function reset() {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const text = await file.text();
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      });
      const parsedHeaders = parsed.meta.fields ?? [];
      if (!parsedHeaders.length) {
        setError("Could not find any columns in that file.");
        setLoading(false);
        return;
      }

      // Ask the server for a suggested mapping (same board-aware matching the
      // commit step uses, including the instructors ADI special case) — best
      // effort, fall back to an empty mapping if it fails.
      let suggested: Record<string, string> = {};
      try {
        const res = await fetch("/ops/api/import", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "preview", board_id: board.id, csv: text }),
        });
        const d = await res.json();
        if (d?.suggestedMapping) suggested = d.suggestedMapping;
      } catch {
        // ignore — founder can map columns manually below
      }

      const initialMapping: Record<string, string> = {};
      for (const h of parsedHeaders) initialMapping[h] = suggested[h] ?? "";

      setFileName(file.name);
      setHeaders(parsedHeaders);
      setRows(parsed.data);
      setMapping(initialMapping);
      setStep("mapping");
    } catch {
      setError("Could not read that file. Make sure it's a valid CSV.");
    } finally {
      setLoading(false);
    }
  }

  async function commit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/ops/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "commit", board_id: board.id, mapping, rows }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Import failed.");
        return;
      }
      setResult({ inserted: d.inserted ?? 0, errors: d.errors ?? [] });
      setStep("result");
      onImported();
    } catch {
      setError("Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Mirrors the server's "last mapped header wins" rule for a field.
  function headerForField(key: string): string | undefined {
    let found: string | undefined;
    for (const h of headers) if (mapping[h] === key) found = h;
    return found;
  }

  const mappedFieldKeys = fields.map((f) => f.key).filter((key) => headerForField(key));
  const previewRows = rows.slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-border p-5 shadow-xl">
        <h2 className="font-display text-xl text-ink mb-1">Import CSV — {board.name}</h2>
        <p className="text-sm text-ink-secondary mb-4">
          {step === "upload" && "Upload a CSV file to bulk-add items to this board."}
          {step === "mapping" && `${fileName} — ${rows.length} row${rows.length === 1 ? "" : "s"} found. Confirm the column mapping below.`}
          {step === "result" && "Import complete."}
        </p>

        {step === "upload" && (
          <div className="rounded-lg border border-dashed border-border bg-blush-surface/40 p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="rounded-lg gradient-bg px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {loading ? "Reading file…" : "Choose CSV file"}
            </button>
            <p className="mt-2 text-xs text-ink-muted">
              First row should contain column headers. We&apos;ll suggest a mapping automatically.
            </p>
          </div>
        )}

        {step === "mapping" && (
          <div>
            {showsAdiNote && (
              <p className="mb-3 rounded-lg border border-blush-border bg-blush-surface px-3 py-2 text-xs text-ink-secondary">
                Sent / Response / Interested columns detected — Stage will be set automatically
                (Interested / Replied / Contacted / Not contacted) for each row.
              </p>
            )}

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-ink-secondary">
                    <th className="px-3 py-2 font-medium">CSV column</th>
                    <th className="px-3 py-2 font-medium">Maps to</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((h) => (
                    <tr key={h} className="border-b border-border/60">
                      <td className="px-3 py-1.5 text-ink whitespace-nowrap">{h}</td>
                      <td className="px-3 py-1.5">
                        <select
                          value={mapping[h] ?? ""}
                          onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value }))}
                          className="rounded-lg border border-border bg-white px-2 py-1 text-sm"
                        >
                          <option value="">Ignore</option>
                          {fields.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-4 mb-2 text-sm font-medium text-ink">
              Preview ({Math.min(previewRows.length, 10)} of {rows.length} rows)
            </h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-ink-secondary">
                    {mappedFieldKeys.map((key) => (
                      <th key={key} className="px-3 py-2 font-medium whitespace-nowrap">
                        {fieldByKey.get(key)?.label ?? key}
                      </th>
                    ))}
                    {!mappedFieldKeys.length && <th className="px-3 py-2 font-medium">—</th>}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/60">
                      {mappedFieldKeys.map((key) => {
                        const header = headerForField(key);
                        return (
                          <td key={key} className="px-3 py-1.5 align-top text-ink-secondary">
                            {header ? row[header] ?? "" : ""}
                          </td>
                        );
                      })}
                      {!mappedFieldKeys.length && (
                        <td className="px-3 py-1.5 text-ink-muted">No columns mapped yet.</td>
                      )}
                    </tr>
                  ))}
                  {!previewRows.length && (
                    <tr>
                      <td className="px-3 py-4 text-center text-ink-muted">No rows found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button onClick={reset} className="mt-3 text-sm text-racing-green hover:underline">
              Choose a different file
            </button>
          </div>
        )}

        {step === "result" && result && (
          <div>
            <p className="text-sm text-ink">
              Inserted <span className="font-medium">{result.inserted}</span> item
              {result.inserted === 1 ? "" : "s"}.
            </p>
            {result.errors.length > 0 && (
              <div className="mt-3 rounded-lg border border-blush-border bg-blush-surface px-3 py-2">
                <p className="text-sm font-medium text-deep-rose">
                  {result.errors.length} row{result.errors.length === 1 ? "" : "s"} could not be
                  imported:
                </p>
                <ul className="mt-1 max-h-40 overflow-y-auto list-disc pl-5 text-xs text-ink-secondary space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-deep-rose">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          {step !== "result" && (
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-ink hover:bg-blush-surface"
            >
              Cancel
            </button>
          )}
          {step === "mapping" && (
            <button
              onClick={commit}
              disabled={loading || !rows.length}
              className="rounded-lg gradient-bg px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {loading ? "Importing…" : `Import ${rows.length} row${rows.length === 1 ? "" : "s"}`}
            </button>
          )}
          {step === "result" && (
            <button onClick={onClose} className="rounded-lg gradient-bg px-4 py-2 text-sm text-white">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
