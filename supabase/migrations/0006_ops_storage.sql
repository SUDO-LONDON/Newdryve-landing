-- Newdryve Ops Portal — private data-room storage bucket + policies.
-- The bucket is PRIVATE (public = false): objects are never reachable by URL.
-- Downloads are served only via short-lived signed URLs generated server-side.

insert into storage.buckets (id, name, public)
values ('data-room', 'data-room', false)
on conflict (id) do update set public = false;

-- Founder-only access to objects in the data-room bucket. There is deliberately
-- NO public/anon policy — anonymous requests to any object are denied.
drop policy if exists "ops data-room founders read"   on storage.objects;
drop policy if exists "ops data-room founders insert" on storage.objects;
drop policy if exists "ops data-room founders update" on storage.objects;
drop policy if exists "ops data-room founders delete" on storage.objects;

create policy "ops data-room founders read" on storage.objects
  for select to authenticated
  using (bucket_id = 'data-room' and public.ops_is_founder());

create policy "ops data-room founders insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'data-room' and public.ops_is_founder());

create policy "ops data-room founders update" on storage.objects
  for update to authenticated
  using (bucket_id = 'data-room' and public.ops_is_founder())
  with check (bucket_id = 'data-room' and public.ops_is_founder());

create policy "ops data-room founders delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'data-room' and public.ops_is_founder());
