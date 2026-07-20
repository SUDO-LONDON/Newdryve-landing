-- Query-shape indexes for the /ops portal.
-- These match the board, dashboard and drawer reads that run on every visit.

create index if not exists ops_items_active_board_updated_idx
  on public.ops_items (board_id, updated_at desc)
  where deleted_at is null;

create index if not exists ops_items_active_due_idx
  on public.ops_items (next_action_date, board_id)
  where deleted_at is null and next_action_date is not null;

create index if not exists ops_activity_created_idx
  on public.ops_activity (created_at desc);

create index if not exists ops_documents_current_version_idx
  on public.ops_documents (current_version_id);
