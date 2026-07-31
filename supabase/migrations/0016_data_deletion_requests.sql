-- Public website account-deletion requests.
--
-- The website inserts these rows through its server-only service-role client.
-- No browser role receives direct table access. Keeping the request before
-- sending the notification provides an audit trail if email delivery fails.

create table if not exists public.data_deletion_requests (
  id                   uuid primary key default gen_random_uuid(),
  first_name           text not null check (char_length(first_name) between 1 and 80),
  last_name            text not null check (char_length(last_name) between 1 and 80),
  email                text not null check (char_length(email) between 3 and 254),
  phone                text not null check (char_length(phone) between 7 and 32),
  status               text not null default 'pending'
                       check (status in ('pending', 'verifying', 'completed', 'rejected')),
  notification_sent_at timestamptz,
  notification_error   text,
  created_at           timestamptz not null default now(),
  completed_at         timestamptz
);

create index if not exists data_deletion_requests_created_at_idx
  on public.data_deletion_requests (created_at desc);

create index if not exists data_deletion_requests_email_idx
  on public.data_deletion_requests (lower(email));

alter table public.data_deletion_requests enable row level security;

-- Deliberately no anon/authenticated policies: only the service role used by
-- the server route can read or write these sensitive privacy requests.
