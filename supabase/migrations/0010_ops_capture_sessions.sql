-- Newdryve Ops Portal — QR receipt-capture handoff sessions.
--
-- A founder on their laptop generates a QR that opens a token-gated mobile page
-- (/ops/capture/<token>) where they photograph a receipt. The photo is stored
-- against the session; the laptop polls and, on Save, attaches it to the new
-- expense.
--
-- The token is a single-use, short-lived (15 min) capability. Anonymous phone
-- requests reach the upload/poll endpoints via the service-role client (which
-- bypasses RLS) after the token is validated server-side; founders create and
-- consume sessions under the RLS policy below.

create table if not exists public.ops_capture_sessions (
  token        text primary key,                 -- 256-bit random hex capability
  created_by   text not null,                    -- founder who started the handoff
  status       text not null default 'pending',  -- pending | received | used | expired
  receipt_path text,                             -- object in the 'receipts' bucket
  receipt_mime text,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  used_at      timestamptz
);
create index if not exists ops_capture_sessions_expires_idx on public.ops_capture_sessions (expires_at);

alter table public.ops_capture_sessions enable row level security;
drop policy if exists ops_capture_sessions_founder_all on public.ops_capture_sessions;
create policy ops_capture_sessions_founder_all on public.ops_capture_sessions
  for all to authenticated
  using (public.ops_is_founder())
  with check (public.ops_is_founder());
