import "server-only";

// Append-only audit trail. Records every personal-data access and every
// data-room action, with founder identity and timestamp. Inserts run under the
// founder's RLS session (append-only policy).
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuditEntry {
  actor_email: string;
  action: string; // upload|download|rename|replace|delete|restore|view_personal_data|export
  target_type?: string;
  target_id?: string;
  detail?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.from("ops_audit_log").insert({
    actor_email: entry.actor_email,
    action: entry.action,
    target_type: entry.target_type ?? null,
    target_id: entry.target_id ?? null,
    detail: entry.detail ?? null,
  });
}
