-- Newdryve Ops Portal — correct Kurtish's founder email.
--
-- kurtish@newdryve.com was never a real mailbox; the address is kurt@newdryve.com.
-- OPS_FOUNDER_ALLOWLIST (middleware) was updated first, which let Kurt sign in —
-- but ops_is_founder() matches the JWT email against ops_allowlist, so with the
-- old row still in place every RLS policy evaluated false and the whole ops
-- dashboard came back empty for him.
--
-- The email is denormalised across the ops tables (no FKs reference
-- ops_allowlist.email), so each occurrence is rewritten explicitly. Idempotent:
-- re-running is a no-op once no kurtish@ rows remain.

-- Allowlist row (email is the primary key). Guarded so this cannot fail if a
-- kurt@ row has already been created by hand.
update public.ops_allowlist
   set email = 'kurt@newdryve.com'
 where lower(email) = 'kurtish@newdryve.com'
   and not exists (
     select 1 from public.ops_allowlist a2 where lower(a2.email) = 'kurt@newdryve.com'
   );

delete from public.ops_allowlist where lower(email) = 'kurtish@newdryve.com';

-- Ownership / attribution columns. ops_kpis.assignee_email also drives the KPI
-- RLS policy, so a stale value here would hide Kurt's own KPIs from him.
update public.ops_kpis       set assignee_email = 'kurt@newdryve.com' where lower(assignee_email) = 'kurtish@newdryve.com';
update public.ops_items      set owner_email    = 'kurt@newdryve.com' where lower(owner_email)    = 'kurtish@newdryve.com';
update public.ops_notes      set author_email   = 'kurt@newdryve.com' where lower(author_email)   = 'kurtish@newdryve.com';
update public.ops_activity   set actor_email    = 'kurt@newdryve.com' where lower(actor_email)    = 'kurtish@newdryve.com';
update public.ops_user_prefs set user_email     = 'kurt@newdryve.com' where lower(user_email)     = 'kurtish@newdryve.com';

-- ops_audit_log is deliberately left untouched: it is an append-only record of
-- what actually happened, and rewriting historical actor identities would
-- falsify the audit trail. There are currently no kurtish@ rows in it anyway.
