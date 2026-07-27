# Newdryve Ops Portal — database

These migrations provision the `/ops` founder portal in the **dedicated
`newdryve-ops` Supabase project** (kept separate from the live product DB).

## Apply order

Run in numeric order. Either paste each file into the Supabase **SQL Editor**,
or use the Supabase CLI:

```bash
supabase link --project-ref <newdryve-ops-ref>
supabase db push            # applies everything in supabase/migrations/
```

| File | Purpose |
|------|---------|
| `0001_ops_schema.sql`        | Tables, indexes, `updated_at` triggers |
| `0002_ops_rls.sql`           | `ops_is_founder()` + RLS on every table |
| `0003_ops_seed_config.sql`   | All 9 boards + their fields (from spec) |
| `0004_ops_seed_allowlist.sql`| Founder allowlist — **edit emails first** |
| `0005_ops_seed_obligations.sql` | Seeds the UEA Grow It grant obligations |
| `0006_ops_storage.sql`       | Private `data-room` bucket + storage RLS |
| `0007_ops_performance_indexes.sql` | Extra indexes for dashboard/board queries |
| `0008_ops_finance_kpis.sql`  | `ops_settings` (funding total), `ops_expenses`, `ops_kpis` + `ops_is_ceo()` + RLS |
| `0009_ops_receipts_storage.sql` | Private `receipts` bucket (expense photos) + storage RLS |
| `0010_ops_capture_sessions.sql` | `ops_capture_sessions` — QR phone→laptop receipt-capture handoff |
| `0011_ops_rename_kurt_email.sql` | Corrects `kurtish@` → `kurt@` across every ops table |
| `0012_ops_pipeline.sql`      | `ops_pipeline_nodes` / `_edges` / `_events` — the delivery-pipeline DAG, unlock + cycle-guard triggers, RLS |
| `0013_ops_pipeline_seed_store_launch.sql` | Seeds the store-submission pipeline (20 nodes, 19 edges). Data only — safe to skip or re-run |
| `0014_ops_pipeline_fix_unlock_stamping.sql` | Fixes `unlocked_at` being stamped on blocked nodes (seeding inserts nodes before edges) |
| `0015_ops_pipeline_harden_function_privileges.sql` | Fixed `search_path` + revokes `anon` EXECUTE on the pipeline SECURITY DEFINER helpers |

### Delivery pipeline (0012–0015)

Replaces the flat weekly-KPI list. An edge means *prerequisite → dependent*, and
a node is only tickable once every prerequisite is done — enforced in RLS via
`ops_pipeline_is_unlocked()`, not merely in the UI. Completing a node unlocks its
dependents and pings their owners on Discord.

`unlocked_at` records when a node genuinely became startable, so
`done_at - unlocked_at` is the owner's real cycle time and excludes any wait on
someone else. `ops_pipeline_edges` carries a trigger rejecting any edge that
would close a dependency cycle.

`ops_kpis` is deliberately left in place — the UI is gone but the historical rows
remain readable. Drop it separately once exported.

Notifications need `OPS_DISCORD_WEBHOOK_URL` and `OPS_DISCORD_USER_IDS` (see
`.env.example`). Unset simply disables pings; the pipeline still works and the UI
says plainly that nobody was notified.

The linter will keep reporting `ops_pipeline_is_unlocked` as executable by
`authenticated`. That is required — the RLS policies call it.

## Before going live

1. **Edit `0004_ops_seed_allowlist.sql`** to the founders' real email addresses,
   and set the identical set in `OPS_FOUNDER_ALLOWLIST` (`.env.local`). The two
   layers must match — middleware reads the env, RLS reads `ops_allowlist`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (see `.env.example`).
3. In the Supabase dashboard, enable **Email** auth and confirm the magic-link
   (OTP) template is active. Add `https://newdryve.com/ops/auth/confirm` (and
   `http://localhost:3000/ops/auth/confirm`) to the allowed redirect URLs.

## RLS verification (SQL editor)

```sql
-- Non-allowlisted email sees nothing:
select set_config('request.jwt.claims','{"email":"stranger@example.com"}', true);
set role authenticated;
select count(*) from public.ops_items;   -- expect 0
reset role;

-- Allowlisted founder sees rows:
select set_config('request.jwt.claims','{"email":"sinan@newdryve.com"}', true);
set role authenticated;
select count(*) from public.ops_items;   -- expect seeded obligations, etc.
reset role;
```
