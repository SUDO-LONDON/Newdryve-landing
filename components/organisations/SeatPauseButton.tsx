"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MemberSeat } from "@/lib/ops/types";
import { apiError, readJson } from "@/lib/organisations/http";

/**
 * "Pause seat for 1 month" or "Resume" for one instructor, behind a confirm
 * (Newdryve ADR-060). The school has no membership of its own; each
 * instructor holds a seat. A paused seat stays linked to the school, is not
 * listed or bookable through it, is charged nothing for the month, and
 * resumes by itself. The instructor can also pause or resume it in the app.
 */
export default function SeatPauseButton({
  endpoint,
  seat,
  instructorName,
}: {
  /** `/organisations/api/members/:id/seat`, with `?organisation_id=` when needed; `/pause` or `/resume` is added. */
  endpoint: string;
  seat: MemberSeat;
  instructorName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paused = seat.status === "paused";

  async function change() {
    const ok = window.confirm(
      paused
        ? `Resume ${instructorName}'s seat now?\n\nThey are listed and bookable through your school again, and its fees for them start again from this week.`
        : `Pause ${instructorName}'s seat for 1 month?\n\n` +
            "They stay linked to your school, but learners can't find or book them through it, and they are not charged " +
            "for that month. It resumes by itself after a month; you or they can resume it sooner."
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    const [path, query] = endpoint.split("?");
    try {
      const response = await fetch(`${path}/${paused ? "resume" : "pause"}${query ? `?${query}` : ""}`, { method: "POST" });
      if (!response.ok) {
        const info = apiError(await readJson(response), response.status, "Could not change that seat.");
        throw new Error(
          info.code === "seat_already_paused" || info.code === "seat_not_paused"
            ? "That seat was changed meanwhile. Refresh to see it."
            : response.status === 404
              ? `${instructorName} is no longer a member. Refresh to see the current list.`
              : info.message
        );
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not change that seat.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void change()}
        disabled={busy}
        aria-label={paused ? `Resume ${instructorName}'s seat` : `Pause ${instructorName}'s seat for 1 month`}
        className="focus-ring inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-ink hover:bg-blush-surface disabled:opacity-60"
      >
        {busy ? "Saving…" : paused ? "Resume" : "Pause seat for 1 month"}
      </button>
      {error ? (
        <span role="alert" className="max-w-56 text-right text-xs text-rose-800">
          {error}
        </span>
      ) : null}
    </span>
  );
}
