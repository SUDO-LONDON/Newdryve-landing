-- Newdryve Ops Portal — Finance (funding + spend) and weekly KPIs.
--
-- Adds three tables:
--   ops_settings  — key/value store; seeds the total funding figure.
--   ops_expenses  — one row per spend, each with a required receipt object.
--   ops_kpis      — weekly KPIs assigned per founder; assignees tick their own.
--
-- Money is stored as integer pence (bigint) to avoid floating-point drift.

-- ---------------------------------------------------------------------------
-- CEO check. Mirrors ops_is_founder() but narrows to the founder whose
-- allowlist role is 'CEO' (seeded as sinan@newdryve.com in 0004). SECURITY
-- DEFINER so it can read ops_allowlist regardless of that table's RLS.
-- ---------------------------------------------------------------------------
create or replace function public.ops_is_ceo()
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
      and a.role = 'CEO'
  );
$$;

revoke all on function public.ops_is_ceo() from public;
grant execute on function public.ops_is_ceo() to authenticated;

-- ---------------------------------------------------------------------------
-- Key/value settings. Currently holds only the total funding figure, in pence.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.ops_settings (key, value) values
  ('funding_total_pence', '750000'::jsonb)   -- £7,500.00
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Expenses. Every spend must reference a receipt object in the private
-- 'receipts' storage bucket (created in 0009); the column is NOT NULL.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_expenses (
  id           uuid primary key default gen_random_uuid(),
  description  text not null,
  category     text,
  amount_pence bigint not null check (amount_pence > 0),
  spent_on     date not null default current_date,
  receipt_path text not null,                 -- path within the 'receipts' bucket
  receipt_mime text,
  created_by   text,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create index if not exists ops_expenses_spent_idx   on public.ops_expenses (spent_on desc);
create index if not exists ops_expenses_deleted_idx on public.ops_expenses (deleted_at);

-- ---------------------------------------------------------------------------
-- Weekly KPIs. Created/assigned by the CEO only; each assignee may tick off
-- their own. week_start is the Monday of the KPI's week.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_kpis (
  id             uuid primary key default gen_random_uuid(),
  week_start     date not null,
  assignee_email text not null,
  title          text not null,
  detail         text,
  done           boolean not null default false,
  done_at        timestamptz,
  created_by     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index if not exists ops_kpis_week_idx     on public.ops_kpis (week_start desc);
create index if not exists ops_kpis_assignee_idx on public.ops_kpis (assignee_email);
create index if not exists ops_kpis_deleted_idx  on public.ops_kpis (deleted_at);

-- updated_at maintenance (reuses the trigger fn from 0001).
drop trigger if exists ops_kpis_touch on public.ops_kpis;
create trigger ops_kpis_touch before update on public.ops_kpis
  for each row execute function public.ops_touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

-- ops_settings + ops_expenses: any allowlisted founder may read and write.
do $$
declare
  t text;
  tables text[] := array['ops_settings','ops_expenses'];
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

-- ops_kpis: founders read everything; only the CEO creates/edits/deletes;
-- an assignee may UPDATE their own row (to tick it off).
alter table public.ops_kpis enable row level security;

drop policy if exists ops_kpis_founder_select on public.ops_kpis;
drop policy if exists ops_kpis_ceo_insert     on public.ops_kpis;
drop policy if exists ops_kpis_update          on public.ops_kpis;
drop policy if exists ops_kpis_ceo_delete      on public.ops_kpis;

create policy ops_kpis_founder_select on public.ops_kpis
  for select to authenticated
  using (public.ops_is_founder());

create policy ops_kpis_ceo_insert on public.ops_kpis
  for insert to authenticated
  with check (public.ops_is_ceo());

-- CEO may update any KPI; an assignee may update only their own (tick-off).
create policy ops_kpis_update on public.ops_kpis
  for update to authenticated
  using (
    public.ops_is_ceo()
    or lower(assignee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    public.ops_is_ceo()
    or lower(assignee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy ops_kpis_ceo_delete on public.ops_kpis
  for delete to authenticated
  using (public.ops_is_ceo());
