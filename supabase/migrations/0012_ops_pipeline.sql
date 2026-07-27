-- Newdryve Ops Portal — delivery pipeline (dependency graph).
--
-- Replaces the flat weekly-KPI list with a DAG: each node is a unit of work
-- owned by one founder, and an edge means "prerequisite -> dependent". A node
-- is READY only once every prerequisite is done; ticking a node can therefore
-- unlock work for someone else, which is what fires the Discord ping.
--
-- Three tables:
--   ops_pipeline_nodes  — the work items (stable `key` so seeds are re-runnable)
--   ops_pipeline_edges  — prerequisite -> dependent, cycle-checked on insert
--   ops_pipeline_events — append-only history; powers cycle-time reporting
--
-- Deliberately NOT dropping ops_kpis: the weekly-KPI UI is removed, but the
-- historical rows stay readable. Drop that table separately once exported.

-- ---------------------------------------------------------------------------
-- Nodes
-- ---------------------------------------------------------------------------
create table if not exists public.ops_pipeline_nodes (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,          -- stable slug, e.g. 'cloud-deploy-workers'
  title       text not null,
  detail      text,
  -- Definition of done. Shown on the card so "ticked" means one agreed thing.
  dod         text,
  track       text not null default 'ops',   -- frontend | backend | cloud | ops
  owner_email text,                          -- null = unassigned; CEO assigns in UI
  due_date    date,
  position    int  not null default 0,       -- ordering within a depth column
  done        boolean not null default false,
  done_at     timestamptz,
  done_by     text,
  -- First moment every prerequisite was satisfied. Set once and never cleared:
  -- it is a historical fact, not current state. (done_at - unlocked_at) is the
  -- owner's true cycle time — how long they took once they COULD start.
  unlocked_at timestamptz,
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  constraint ops_pipeline_nodes_track_check
    check (track in ('frontend','backend','cloud','ops'))
);

create index if not exists ops_pipeline_nodes_track_idx   on public.ops_pipeline_nodes (track);
create index if not exists ops_pipeline_nodes_owner_idx   on public.ops_pipeline_nodes (owner_email);
create index if not exists ops_pipeline_nodes_deleted_idx on public.ops_pipeline_nodes (deleted_at);

drop trigger if exists ops_pipeline_nodes_touch on public.ops_pipeline_nodes;
create trigger ops_pipeline_nodes_touch before update on public.ops_pipeline_nodes
  for each row execute function public.ops_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Edges: from_key must be done before to_key can start.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_pipeline_edges (
  id         uuid primary key default gen_random_uuid(),
  from_key   text not null references public.ops_pipeline_nodes (key) on delete cascade on update cascade,
  to_key     text not null references public.ops_pipeline_nodes (key) on delete cascade on update cascade,
  created_by text,
  created_at timestamptz not null default now(),
  constraint ops_pipeline_edges_unique  unique (from_key, to_key),
  constraint ops_pipeline_edges_no_self check (from_key <> to_key)
);

create index if not exists ops_pipeline_edges_from_idx on public.ops_pipeline_edges (from_key);
create index if not exists ops_pipeline_edges_to_idx   on public.ops_pipeline_edges (to_key);

-- ---------------------------------------------------------------------------
-- Events: append-only. 'completed' | 'reopened' | 'unlocked' | 'notified'
-- ---------------------------------------------------------------------------
create table if not exists public.ops_pipeline_events (
  id           uuid primary key default gen_random_uuid(),
  node_key     text not null,
  kind         text not null,
  actor_email  text,
  detail       jsonb,
  created_at   timestamptz not null default now(),
  constraint ops_pipeline_events_kind_check
    check (kind in ('completed','reopened','unlocked','notified','notify_failed'))
);

create index if not exists ops_pipeline_events_node_idx on public.ops_pipeline_events (node_key, created_at desc);
create index if not exists ops_pipeline_events_kind_idx on public.ops_pipeline_events (kind, created_at desc);

-- ---------------------------------------------------------------------------
-- Is every prerequisite of p_key satisfied? Soft-deleted prerequisites are
-- ignored — deleting a blocker must not permanently freeze its dependents.
-- ---------------------------------------------------------------------------
create or replace function public.ops_pipeline_is_unlocked(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.ops_pipeline_edges e
    join public.ops_pipeline_nodes n on n.key = e.from_key
    where e.to_key = p_key
      and n.deleted_at is null
      and n.done = false
  );
$$;

revoke all on function public.ops_pipeline_is_unlocked(text) from public;
grant execute on function public.ops_pipeline_is_unlocked(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Cycle guard. A DAG that admits a cycle would deadlock every node in it, so
-- reject the edge at write time rather than rendering an impossible graph.
-- ---------------------------------------------------------------------------
create or replace function public.ops_pipeline_edges_no_cycle()
returns trigger
language plpgsql
as $$
begin
  -- Walk forward from the proposed dependent. If we can reach the prerequisite,
  -- adding this edge closes a loop.
  if exists (
    with recursive reachable as (
      select new.to_key as k
      union
      select e.to_key
      from public.ops_pipeline_edges e
      join reachable r on e.from_key = r.k
    )
    select 1 from reachable where k = new.from_key
  ) then
    raise exception 'ops_pipeline_edges: % -> % would create a dependency cycle',
      new.from_key, new.to_key;
  end if;
  return new;
end;
$$;

drop trigger if exists ops_pipeline_edges_cycle_guard on public.ops_pipeline_edges;
create trigger ops_pipeline_edges_cycle_guard
  before insert or update on public.ops_pipeline_edges
  for each row execute function public.ops_pipeline_edges_no_cycle();

-- ---------------------------------------------------------------------------
-- Stamp unlocked_at on nodes that have become ready. Called after a node's
-- done flag flips and after a new edge lands. Idempotent: only ever fills a
-- null, so the first-unlock timestamp is preserved for cycle-time maths.
-- ---------------------------------------------------------------------------
create or replace function public.ops_pipeline_refresh_unlocks()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with newly as (
    update public.ops_pipeline_nodes n
       set unlocked_at = now()
     where n.deleted_at is null
       and n.unlocked_at is null
       and public.ops_pipeline_is_unlocked(n.key)
    returning n.key
  )
  insert into public.ops_pipeline_events (node_key, kind, detail)
  select key, 'unlocked', jsonb_build_object('source', 'trigger') from newly;
end;
$$;

revoke all on function public.ops_pipeline_refresh_unlocks() from public;
grant execute on function public.ops_pipeline_refresh_unlocks() to authenticated;

-- Root nodes (no prerequisites) are unlocked the moment they are created.
create or replace function public.ops_pipeline_nodes_after_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ops_pipeline_refresh_unlocks();
  return null;
end;
$$;

drop trigger if exists ops_pipeline_nodes_unlock on public.ops_pipeline_nodes;
create trigger ops_pipeline_nodes_unlock
  after insert or update of done, deleted_at on public.ops_pipeline_nodes
  for each statement execute function public.ops_pipeline_nodes_after_write();

drop trigger if exists ops_pipeline_edges_unlock on public.ops_pipeline_edges;
create trigger ops_pipeline_edges_unlock
  after insert or delete on public.ops_pipeline_edges
  for each statement execute function public.ops_pipeline_nodes_after_write();

-- ---------------------------------------------------------------------------
-- RLS
--   nodes  — founders read; CEO writes structure; an owner may tick their own
--            node, but only once it is actually unlocked.
--   edges  — founders read; CEO writes.
--   events — founders read; founders append (the API writes as the caller).
-- ---------------------------------------------------------------------------
alter table public.ops_pipeline_nodes  enable row level security;
alter table public.ops_pipeline_edges  enable row level security;
alter table public.ops_pipeline_events enable row level security;

drop policy if exists ops_pipeline_nodes_select on public.ops_pipeline_nodes;
drop policy if exists ops_pipeline_nodes_insert on public.ops_pipeline_nodes;
drop policy if exists ops_pipeline_nodes_update on public.ops_pipeline_nodes;
drop policy if exists ops_pipeline_nodes_delete on public.ops_pipeline_nodes;

create policy ops_pipeline_nodes_select on public.ops_pipeline_nodes
  for select to authenticated
  using (public.ops_is_founder());

create policy ops_pipeline_nodes_insert on public.ops_pipeline_nodes
  for insert to authenticated
  with check (public.ops_is_ceo());

-- The owner-tick path is deliberately narrow: you may only touch a node that
-- is yours AND unlocked. Ticking a blocked node is the one thing this whole
-- design exists to prevent, so it is refused in the database, not just the UI.
create policy ops_pipeline_nodes_update on public.ops_pipeline_nodes
  for update to authenticated
  using (
    public.ops_is_ceo()
    or (
      lower(coalesce(owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and public.ops_pipeline_is_unlocked(key)
    )
  )
  with check (
    public.ops_is_ceo()
    or (
      lower(coalesce(owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and public.ops_pipeline_is_unlocked(key)
    )
  );

create policy ops_pipeline_nodes_delete on public.ops_pipeline_nodes
  for delete to authenticated
  using (public.ops_is_ceo());

drop policy if exists ops_pipeline_edges_select on public.ops_pipeline_edges;
drop policy if exists ops_pipeline_edges_write  on public.ops_pipeline_edges;

create policy ops_pipeline_edges_select on public.ops_pipeline_edges
  for select to authenticated
  using (public.ops_is_founder());

create policy ops_pipeline_edges_write on public.ops_pipeline_edges
  for all to authenticated
  using (public.ops_is_ceo())
  with check (public.ops_is_ceo());

drop policy if exists ops_pipeline_events_select on public.ops_pipeline_events;
drop policy if exists ops_pipeline_events_insert on public.ops_pipeline_events;

create policy ops_pipeline_events_select on public.ops_pipeline_events
  for select to authenticated
  using (public.ops_is_founder());

create policy ops_pipeline_events_insert on public.ops_pipeline_events
  for insert to authenticated
  with check (public.ops_is_founder());
