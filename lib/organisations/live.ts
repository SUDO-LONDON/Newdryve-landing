/**
 * Wording for the live board. A sick day reaches the board as blocked time
 * whose reason is the code `sick_day` (ADR-045); a school must read "Off
 * sick", never the raw code. The API words the status detail itself from
 * Newdryve PR #512, but `blocks_today[].label` still carries the reason, and
 * an older API words neither. Client-safe.
 */

import type { LiveResponse } from "@/lib/organisations/types";

const SICK_DAY = "sick_day";
export const OFF_SICK = "Off sick";

export function readableBlockLabel(label: string | null | undefined): string {
  const text = (label ?? "").trim();
  if (!text) return "Blocked out";
  return text === SICK_DAY ? OFF_SICK : text;
}

/** "sick_day until 17:00" → "Off sick until 17:00". */
export function readableStatusDetail(detail: string | null): string | null {
  if (!detail) return detail;
  return detail.startsWith(`${SICK_DAY} `) || detail === SICK_DAY ? `${OFF_SICK}${detail.slice(SICK_DAY.length)}` : detail;
}

export function readableLive(live: LiveResponse): LiveResponse {
  return {
    ...live,
    instructors: live.instructors.map((instructor) => ({
      ...instructor,
      status: { ...instructor.status, detail: readableStatusDetail(instructor.status.detail) },
      blocks_today: instructor.blocks_today.map((block) => ({ ...block, label: readableBlockLabel(block.label) })),
    })),
  };
}
