import "server-only";

// Discord notifier for the delivery pipeline.
//
// Fired when completing a node unlocks work for someone else. Notification is
// best-effort by design: a webhook outage must never fail the tick that the
// founder just performed, so every path here resolves rather than throws and
// the outcome is recorded as a pipeline event instead.

import { DISCORD_WEBHOOK_URL, discordIdFor } from "@/lib/ops/env";
import type { Founder, OpsPipelineNode } from "@/lib/ops/types";

const COLOUR_UNLOCK = 0x2d6a4f; // racing green
const TIMEOUT_MS = 5_000;

export type NotifyResult =
  | { ok: true; skipped?: "not_configured" | "nothing_to_say" }
  | { ok: false; error: string };

function nameFor(founders: Founder[], email: string | null): string {
  if (!email) return "Unassigned";
  const match = founders.find((f) => f.email.toLowerCase() === email.toLowerCase());
  return match?.name || email;
}

/** `<@id>` if we know their Discord id, otherwise their display name. */
function mentionFor(founders: Founder[], email: string | null): string {
  if (!email) return "**Unassigned**";
  const id = discordIdFor(email);
  return id ? `<@${id}>` : `**${nameFor(founders, email)}**`;
}

function dueLabel(due: string | null): string {
  if (!due) return "no date";
  return new Date(`${due}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Announce that `completed` is done and `unlocked` is now startable.
 *
 * Owners of newly-unlocked nodes are mentioned in `content` (embeds do not
 * generate pings), and allowed_mentions is restricted to exactly those ids so
 * a crafted node title can never trigger an @everyone.
 */
export async function notifyUnlock({
  completed,
  unlocked,
  actorEmail,
  founders,
  portalUrl,
}: {
  completed: OpsPipelineNode;
  unlocked: OpsPipelineNode[];
  actorEmail: string;
  founders: Founder[];
  portalUrl: string;
}): Promise<NotifyResult> {
  if (!DISCORD_WEBHOOK_URL) return { ok: true, skipped: "not_configured" };
  if (unlocked.length === 0) return { ok: true, skipped: "nothing_to_say" };

  const mentionIds = [
    ...new Set(
      unlocked
        .map((n) => (n.owner_email ? discordIdFor(n.owner_email) : null))
        .filter((id): id is string => !!id)
    ),
  ];

  const mentions = [
    ...new Set(unlocked.map((n) => mentionFor(founders, n.owner_email))),
  ].join(" ");

  const plural = unlocked.length === 1 ? "task is" : "tasks are";

  const payload = {
    content: `${mentions} — you're unblocked. ${unlocked.length} ${plural} now ready.`,
    embeds: [
      {
        title: `Done: ${completed.title}`,
        description:
          `Completed by ${nameFor(founders, actorEmail)}. ` +
          `This unblocks the following:`,
        color: COLOUR_UNLOCK,
        fields: unlocked.slice(0, 10).map((n) => ({
          name: n.title,
          value:
            `${nameFor(founders, n.owner_email)} · ${n.track} · due ${dueLabel(n.due_date)}` +
            (n.dod ? `\n_${n.dod.slice(0, 240)}_` : ""),
          inline: false,
        })),
        url: portalUrl,
        footer: { text: "Newdryve delivery pipeline" },
        timestamp: new Date().toISOString(),
      },
    ],
    allowed_mentions: { parse: [] as string[], users: mentionIds },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `discord ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}
