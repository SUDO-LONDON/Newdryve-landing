-- Public website learner waitlist signups.
--
-- The website inserts these rows through its server-only service-role client.
-- No browser role receives direct table access. Keeping the signup before
-- sending the notification provides an audit trail if email delivery fails.

-- `city` is validated server-side against the same test-centre city list the
-- instructor application form binds its city <select> to (see
-- apps/marketing/src/data/driving-test-centres.ts), so it is free text here
-- rather than an enum: the source of truth for valid cities lives in that
-- generated list, not in the schema.
create table if not exists public.waitlist_signups (
  id                   uuid primary key default gen_random_uuid(),
  email                text not null check (char_length(email) between 3 and 254),
  name                 text not null default '',
  city                 text not null default '',
  notes                text not null default '',
  notification_sent_at timestamptz,
  notification_error   text,
  created_at           timestamptz not null default now()
);

create index if not exists waitlist_signups_created_at_idx
  on public.waitlist_signups (created_at desc);

create index if not exists waitlist_signups_email_idx
  on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;

-- Deliberately no anon/authenticated policies: only the service role used by
-- the server route can read or write these leads.
