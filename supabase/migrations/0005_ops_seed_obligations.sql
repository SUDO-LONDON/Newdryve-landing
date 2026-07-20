-- Newdryve Ops Portal — seed known UEA Enterprise Fund "Grow It" obligations.
-- Due dates are placeholders (founders should adjust to the real schedule).
-- Idempotent: keyed on the obligation text so re-running does not duplicate.
insert into public.ops_items (board_id, stage, data, created_by)
select 'obligations', v.stage, v.data, 'system'
from (values
  ('Upcoming'::text, jsonb_build_object(
     'funder','UEA Enterprise Fund (Grow It award)',
     'obligation','Submit quarterly progress summaries to the Fund.',
     'obligation_type','Reporting',
     'recurring','Quarterly',
     'due_date','2026-09-30',
     'notes','Recurring quarterly. Adjust due date to the real reporting cycle.'
   )),
  ('In progress'::text, jsonb_build_object(
     'funder','UEA Enterprise Fund (Grow It award)',
     'obligation','Funds are restricted solely to the Project described in the grant application. Any other use requires prior written consent from the Fund and triggers immediate repayment.',
     'obligation_type','Spend restriction',
     'recurring','One-off',
     'due_date','2026-12-31',
     'notes','Ongoing restriction for the life of the grant.'
   )),
  ('Upcoming'::text, jsonb_build_object(
     'funder','UEA Enterprise Fund (Grow It award)',
     'obligation','Repay the full grant as a first charge if project IP is sold or licensed to an external organisation.',
     'obligation_type','Other',
     'recurring','One-off',
     'due_date','2026-12-31',
     'notes','Contingent obligation; monitor on any IP transaction.'
   )),
  ('In progress'::text, jsonb_build_object(
     'funder','UEA Enterprise Fund (Grow It award)',
     'obligation','Maintain ongoing engagement with the UEA Student Enterprise Team.',
     'obligation_type','Meeting / engagement',
     'recurring','One-off',
     'due_date','2026-09-30',
     'notes','Keep a regular check-in cadence with the Student Enterprise Team.'
   ))
) as v(stage, data)
where not exists (
  select 1 from public.ops_items i
  where i.board_id = 'obligations'
    and i.data->>'obligation' = v.data->>'obligation'
);
