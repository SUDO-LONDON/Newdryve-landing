"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiError, readJson } from "@/lib/organisations/http";

/**
 * "Remove from organisation" for one instructor, behind a confirm. Used by the
 * school portal and by ops, each with its own endpoint. The API ends the
 * membership (the API stops billing them; the week they leave is not invoiced)
 * and notifies the school's admins; the page then re-reads the roster.
 */
export default function RemoveMemberButton({
  endpoint,
  instructorName,
  organisationName,
  className,
}: {
  endpoint: string;
  instructorName: string;
  organisationName: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    const ok = window.confirm(
      `Remove ${instructorName} from ${organisationName}?\n\n` +
        "They leave the organisation and its listing, and the organisation stops charging them a fee. " +
        "The organisation's admins are notified. They can rejoin later with the join code."
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) {
        const info = apiError(await readJson(response), response.status, "Could not remove that instructor.");
        throw new Error(
          response.status === 404 ? `${instructorName} is no longer a member. Refresh to see the current list.` : info.message
        );
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove that instructor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void remove()}
        disabled={busy}
        aria-label={`Remove ${instructorName} from ${organisationName}`}
        className={
          className ??
          "focus-ring inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-60"
        }
      >
        {busy ? "Removing…" : "Remove from organisation"}
      </button>
      {error ? (
        <span role="alert" className="max-w-56 text-right text-xs text-rose-800">
          {error}
        </span>
      ) : null}
    </span>
  );
}
