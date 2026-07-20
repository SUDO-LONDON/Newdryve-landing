-- Newdryve Ops Portal — Row Level Security
-- Every ops_ table is locked to allowlisted founders. This is the second of
-- the two enforcement layers (the first being Next.js middleware). Even a
-- valid Supabase account that is not on the allowlist reads zero rows.

-- Allowlist membership check. SECURITY DEFINER so it can read ops_allowlist
-- regardless of that table's own RLS.
create or replace function public.ops_is_founder()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ops_allowlist a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.ops_is_founder() from public;
grant execute on function public.ops_is_founder() to authenticated;

-- Helper: enable RLS + a single founder-only ALL policy on a table.
do $$
declare
  t text;
  -- ops_audit_log is handled separately (append-only for founders).
  tables text[] := array[
    'ops_boards','ops_fields','ops_items','ops_notes','ops_activity',
    'ops_documents','ops_document_versions','ops_user_prefs'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_founder_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.ops_is_founder()) with check (public.ops_is_founder());',
      t || '_founder_all', t
    );
  end loop;
end $$;

-- ops_audit_log: append-only for founders — they may INSERT and SELECT, but
-- never UPDATE or DELETE (the service role handles any retention management).
alter table public.ops_audit_log enable row level security;
drop policy if exists ops_audit_log_founder_select on public.ops_audit_log;
drop policy if exists ops_audit_log_founder_insert on public.ops_audit_log;
create policy ops_audit_log_founder_select on public.ops_audit_log
  for select to authenticated using (public.ops_is_founder());
create policy ops_audit_log_founder_insert on public.ops_audit_log
  for insert to authenticated with check (public.ops_is_founder());

-- ops_allowlist: founders may READ (to populate owner pickers), but writes are
-- reserved for the service role (which bypasses RLS). No write policy is
-- created for authenticated users.
alter table public.ops_allowlist enable row level security;
drop policy if exists ops_allowlist_founder_read on public.ops_allowlist;
create policy ops_allowlist_founder_read on public.ops_allowlist
  for select to authenticated
  using (public.ops_is_founder());
