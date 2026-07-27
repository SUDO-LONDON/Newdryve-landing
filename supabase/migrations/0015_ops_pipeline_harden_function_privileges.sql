-- Newdryve Ops Portal — security hardening for the pipeline functions.
-- Raised by the Supabase database linter after 0012.
--
-- Two problems:
--
-- 1. ops_pipeline_edges_no_cycle had no fixed search_path. The other pipeline
--    functions set it; this one was missed.
--
-- 2. Supabase's default privileges grant EXECUTE on new functions to anon and
--    authenticated. `revoke ... from public` does NOT undo an explicit role
--    grant, so the SECURITY DEFINER helpers stayed reachable over PostgREST —
--    including by anon. ops_pipeline_refresh_unlocks() writes (it stamps
--    unlocked_at and inserts events), so an unauthenticated caller could poke it
--    via /rest/v1/rpc.
--
-- ops_pipeline_is_unlocked keeps EXECUTE for `authenticated`: the RLS policies
-- call it, and policy evaluation requires the querying role to hold it. The
-- linter still reports that one — it is intentional, not an oversight.
--
-- Trigger functions need no direct EXECUTE grant; they run as part of the DML.

create or replace function public.ops_pipeline_edges_no_cycle()
returns trigger
language plpgsql
set search_path = public
as $$
begin
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

revoke all on function public.ops_pipeline_edges_no_cycle()    from public, anon, authenticated;
revoke all on function public.ops_pipeline_nodes_after_write() from public, anon, authenticated;
revoke all on function public.ops_pipeline_refresh_unlocks()   from public, anon, authenticated;
revoke all on function public.ops_pipeline_is_unlocked(text)   from public, anon;

grant execute on function public.ops_pipeline_is_unlocked(text) to authenticated;
