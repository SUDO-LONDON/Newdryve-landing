-- Newdryve Ops Portal — private 'receipts' storage bucket + policies.
-- Receipt photos for expenses. PRIVATE (public = false): objects are never
-- reachable by URL; downloads are served only via short-lived signed URLs
-- generated server-side, exactly like the data-room bucket.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set public = false;

-- Founder-only access to objects in the receipts bucket. No public/anon policy.
drop policy if exists "ops receipts founders read"   on storage.objects;
drop policy if exists "ops receipts founders insert" on storage.objects;
drop policy if exists "ops receipts founders update" on storage.objects;
drop policy if exists "ops receipts founders delete" on storage.objects;

create policy "ops receipts founders read" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and public.ops_is_founder());

create policy "ops receipts founders insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and public.ops_is_founder());

create policy "ops receipts founders update" on storage.objects
  for update to authenticated
  using (bucket_id = 'receipts' and public.ops_is_founder())
  with check (bucket_id = 'receipts' and public.ops_is_founder());

create policy "ops receipts founders delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and public.ops_is_founder());
