-- Newdryve Ops Portal — core schema
-- All portal tables are prefixed ops_ and kept logically separate from the
-- live product database. RLS is added in 0002; this file is structure only.

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Founder allowlist. Source of truth for RLS. Seeded in 0004 and kept in sync
-- with the OPS_FOUNDER_ALLOWLIST env var used by middleware.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_allowlist (
  email       text primary key,
  name        text,
  role        text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Board registry. One row per pipeline board across all three modules.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_boards (
  id          text primary key,               -- e.g. 'instructors'
  module      text not null,                  -- customer_outreach | marketing_outreach | investor_outreach
  name        text not null,
  description text,
  stages      text[] not null default '{}',
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Field metadata. Drives the generic Board UI, table columns and CSV mapping.
-- The four "promoted" keys (stage, owner, next_action, next_action_date) are
-- persisted to ops_items columns; every other key lives in ops_items.data.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_fields (
  id           uuid primary key default gen_random_uuid(),
  board_id     text not null references public.ops_boards(id) on delete cascade,
  key          text not null,
  label        text not null,
  type         text not null,                 -- text|longtext|email|url|number|date|select|stage|boolean|currency|founder_ref
  options      jsonb,                          -- array of strings for select
  required     boolean not null default false,
  is_sensitive boolean not null default false, -- personal data under UK GDPR
  note         text,
  position     int not null default 0,
  unique (board_id, key)
);

-- ---------------------------------------------------------------------------
-- Items. One card per row. Common cross-board fields are promoted to columns
-- so the dashboard / due-and-overdue view can query across every board; the
-- remaining board-specific fields live in `data` keyed by ops_fields.key.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_items (
  id               uuid primary key default gen_random_uuid(),
  board_id         text not null references public.ops_boards(id) on delete cascade,
  stage            text,
  owner_email      text,
  next_action      text,
  next_action_date date,
  data             jsonb not null default '{}'::jsonb,
  created_by       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index if not exists ops_items_board_idx      on public.ops_items (board_id);
create index if not exists ops_items_stage_idx       on public.ops_items (board_id, stage);
create index if not exists ops_items_next_action_idx on public.ops_items (next_action_date);
create index if not exists ops_items_deleted_idx     on public.ops_items (deleted_at);
create index if not exists ops_items_data_gin        on public.ops_items using gin (data);

-- ---------------------------------------------------------------------------
-- Timestamped notes, attributed to the founder who wrote them.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_notes (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references public.ops_items(id) on delete cascade,
  author_email text,
  body         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists ops_notes_item_idx on public.ops_notes (item_id);

-- ---------------------------------------------------------------------------
-- Activity log: field changes, stage transitions, create/delete/restore.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_activity (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.ops_items(id) on delete cascade,
  actor_email text,
  kind        text not null,                  -- created|field_change|stage_change|note_added|deleted|restored
  field       text,
  old_value   text,
  new_value   text,
  created_at  timestamptz not null default now()
);
create index if not exists ops_activity_item_idx on public.ops_activity (item_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Data room documents + version history. Files themselves live in the private
-- 'data-room' storage bucket (created in 0006); rows here hold metadata only.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_documents (
  id                 uuid primary key default gen_random_uuid(),
  category           text not null,
  name               text not null,
  description        text,
  confidential       boolean not null default false,
  current_version_id uuid,
  created_by         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);
create index if not exists ops_documents_category_idx on public.ops_documents (category);
create index if not exists ops_documents_deleted_idx  on public.ops_documents (deleted_at);

create table if not exists public.ops_document_versions (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references public.ops_documents(id) on delete cascade,
  storage_path  text not null,                -- path within the private bucket
  version_label text,
  size          bigint,
  mime          text,
  uploaded_by   text,
  uploaded_at   timestamptz not null default now()
);
create index if not exists ops_document_versions_doc_idx on public.ops_document_versions (document_id, uploaded_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ops_documents_current_version_fk'
      and conrelid = 'public.ops_documents'::regclass
  ) then
    alter table public.ops_documents
      add constraint ops_documents_current_version_fk
      foreign key (current_version_id) references public.ops_document_versions(id)
      on delete set null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Audit log. Every data-room action and every personal-data access.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_email text,
  action      text not null,                  -- upload|download|rename|replace|delete|restore|view_personal_data|export
  target_type text,                           -- document|item|board
  target_id   text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists ops_audit_created_idx on public.ops_audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- Per-founder persisted view state (last-used kanban/table view per board).
-- ---------------------------------------------------------------------------
create table if not exists public.ops_user_prefs (
  user_email text not null,
  board_id   text not null,
  view       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_email, board_id)
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.ops_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ops_items_touch on public.ops_items;
create trigger ops_items_touch before update on public.ops_items
  for each row execute function public.ops_touch_updated_at();

drop trigger if exists ops_documents_touch on public.ops_documents;
create trigger ops_documents_touch before update on public.ops_documents
  for each row execute function public.ops_touch_updated_at();
