-- Newdryve Ops Portal — fix: unlocked_at stamped on nodes that are not unlocked.
--
-- Cause: ops_pipeline_refresh_unlocks() only ever FILLED nulls, never cleared
-- them. Seeding inserts nodes before edges, so the insert trigger ran against an
-- edgeless graph and stamped all 20 nodes as startable; the edges added
-- afterwards never undid it. The same flaw bites any time a prerequisite is
-- added to a node that already exists.
--
-- Left unfixed this silently corrupts the only metric the column exists for:
-- (done_at - unlocked_at) would have counted every hour a task spent BLOCKED as
-- its owner's cycle time.
--
-- Rule now: for a node that is not done, unlocked_at is non-null iff it is
-- genuinely unlocked under its CURRENT edges. Done nodes keep their stamp, so
-- completed cycle times are never rewritten.

create or replace function public.ops_pipeline_refresh_unlocks()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Retract stamps the current edge set no longer justifies.
  update public.ops_pipeline_nodes n
     set unlocked_at = null
   where n.deleted_at is null
     and n.done = false
     and n.unlocked_at is not null
     and not public.ops_pipeline_is_unlocked(n.key);

  -- Stamp whatever has genuinely become startable.
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

-- Editing an edge can change what is blocked, so react to updates too.
drop trigger if exists ops_pipeline_edges_unlock on public.ops_pipeline_edges;
create trigger ops_pipeline_edges_unlock
  after insert or update or delete on public.ops_pipeline_edges
  for each statement execute function public.ops_pipeline_nodes_after_write();

-- Repair existing data and drop the unlock events that were never real.
delete from public.ops_pipeline_events e
 where e.kind = 'unlocked'
   and exists (
     select 1 from public.ops_pipeline_nodes n
      where n.key = e.node_key
        and n.done = false
        and not public.ops_pipeline_is_unlocked(n.key)
   );

select public.ops_pipeline_refresh_unlocks();
