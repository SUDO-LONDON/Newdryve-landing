"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { shortDate } from "@/lib/organisations/format";
import { apiError, readJson } from "@/lib/organisations/http";
import { reinviteEndpoint, type RemovedMember } from "@/lib/organisations/removed-members";

/**
 * The instructors this school removed. They cannot rejoin with the school code
 * until an admin unbans them here; "Unban and send invite" also emails them
 * that the school wants them back (they still need the code from the school).
 */
export default function BannedInstructors({
  organisationId,
  organisationName,
  members,
}: {
  organisationId: string;
  organisationName: string;
  members: RemovedMember[];
}) {
  return (
    <div className="mt-6 border-t border-border pt-5">
      <h4 className="font-display text-lg text-ink">Banned instructors</h4>
      <p className="mt-1 text-sm text-ink-secondary">
        Instructors you removed cannot rejoin {organisationName} with your school code until you unban them.
      </p>
      {members.length ? (
        <ul className="mt-3 divide-y divide-border">
          {members.map((member) => (
            <BannedRow key={member.instructor_id} organisationId={organisationId} member={member} />
          ))}
        </ul>
      ) : (
        <p className="py-4 text-sm text-ink-muted">No banned instructors.</p>
      )}
    </div>
  );
}

function BannedRow({ organisationId, member }: { organisationId: string; member: RemovedMember }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"unban" | "invite" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function unban(sendInvite: boolean) {
    setBusy(sendInvite ? "invite" : "unban");
    setError(null);
    setNote(null);
    try {
      const response = await fetch(reinviteEndpoint(member.instructor_id), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organisation_id: organisationId, send_invite: sendInvite }),
      });
      const body = await readJson(response);
      if (!response.ok) {
        const info = apiError(body, response.status, "Could not unban that instructor.");
        throw new Error(
          response.status === 404 ? `${member.display_name} is no longer banned. Refresh to see the current list.` : info.message
        );
      }
      const sent = Boolean(body && typeof body === "object" && (body as { invite_sent?: unknown }).invite_sent);
      if (sendInvite && !sent) setNote(`${member.display_name} is unbanned, but the invite email could not be sent. Tell them yourself.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not unban that instructor.");
    } finally {
      setBusy(null);
    }
  }

  const button =
    "focus-ring inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold hover:bg-blush-surface disabled:opacity-60";
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-ink">{member.display_name}</p>
        <p className="text-xs text-ink-muted">
          {member.email ? `${member.email} · ` : ""}Removed {shortDate(member.removed_at)}
        </p>
      </div>
      <span className="flex flex-col items-start gap-1 sm:items-end">
        <span className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => void unban(false)}
            disabled={busy !== null}
            aria-label={`Unban ${member.display_name}`}
            className={`${button} text-ink`}
          >
            {busy === "unban" ? "Unbanning…" : "Unban"}
          </button>
          <button
            type="button"
            onClick={() => void unban(true)}
            disabled={busy !== null}
            aria-label={`Unban ${member.display_name} and send an invite`}
            className={`${button} text-emerald-800`}
          >
            {busy === "invite" ? "Sending…" : "Unban and send invite"}
          </button>
        </span>
        {error ? (
          <span role="alert" className="max-w-72 text-xs text-rose-800 sm:text-right">
            {error}
          </span>
        ) : null}
        {note ? (
          <span role="status" className="max-w-72 text-xs text-amber-800 sm:text-right">
            {note}
          </span>
        ) : null}
      </span>
    </li>
  );
}
