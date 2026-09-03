# Organisations unfinished work handoff

Date: 2026-09-03

## Context

Sinan clarified that `/organisations` should be its own isolated organisation admin portal, not a public marketing page and not part of founder `/ops`.

Correct target shape:

- `/ops/organisations` = founder-only control panel.
- `/organisations` = organisation admin portal.
- Organisation admins sign in with email + password.
- Organisation admins only see their own organisation, linked instructors, lesson presence, completed lesson totals, and revenue.
- Founder ops should create the organisation and create/administer the organisation admin login.

## Important live incident found during this work

The live app booking endpoints were 500ing because backend commit `7ac1a52` accidentally added `reviewed` to `BOOKING_COLUMNS`, but `reviewed` is not a real `bookings` table column. It is computed from the `reviews` table.

Emergency hotfix already pushed to `Newdryve/main`:

- Commit: `5b9d04f fix(bookings): stop selecting computed reviewed flag`
- Changed only:
  - `backend/src/modules/_dto.ts`
  - `backend/test/unit/booking-columns.test.ts`
- Local validation before push:
  - backend typecheck passed
  - backend tests passed: 523/523
  - backend lint passed

At the time work paused, GitHub backend CI run `33804239747` was still in progress and Railway was waiting for CI. Verify Railway deploy before assuming the booking 500 is live-fixed.

## Local unfinished backend work in `/Users/sinan/Documents/GitHub/Newdryve`

Uncommitted local WIP adds first-class organisation admin support.

Main intended backend changes:

- Add role support for `organisation_admin`.
- Add migration for `public.user_role` enum value `organisation_admin`.
- Add `public.organisation_admins` mapping table.
- Update signup/profile triggers so organisation admin auth users are not treated like learners missing DOB.
- Add founder endpoint:
  - `POST /v1/ops/organisations/:id/admins`
  - Creates Supabase Auth email/password account and links it to an organisation.
- Add organisation admin endpoint:
  - `GET /v1/organisations/me`
  - Requires `organisation_admin` or `super_admin`.
  - Non-founder org admins only receive organisations they are mapped to.

Uncommitted files touched/added in `Newdryve`:

- `backend/src/modules/_dto.ts`
- `backend/src/modules/organisations/index.ts`
- `backend/src/plugins/auth.ts`
- `backend/src/types/index.ts`
- `backend/test/integration/bookings-export.test.ts`
- `backend/test/integration/identity.test.ts`
- `backend/test/unit/billing.test.ts`
- `backend/test/unit/connect.test.ts`
- `backend/supabase/migrations/20260903213000__organisation_admin_role.sql`
- `backend/supabase/migrations/20260903213100__organisation_admin_accounts.sql`

Local validation of the WIP passed:

- backend typecheck
- backend lint
- backend tests: 523/523

Do not push this WIP until the live booking hotfix has deployed cleanly.

## Local unfinished landing work in `/Users/sinan/Documents/GitHub/Newdryve-landing`

Uncommitted local WIP restructures the bad organisations routing.

Main intended landing changes:

- Move founder organisation control panel from top-level `/organisations` into `/ops/organisations`.
- Add `/ops/api/organisations/[id]/admins` route so founder ops can create an organisation admin login.
- Add isolated `/organisations/login` with email/password Supabase auth against the product Supabase project.
- Add `/organisations` dashboard for org admins.
- Add `/organisations/denied` for signed-in users who are not mapped as organisation admins.
- Add `/organisations/auth/signout`.
- Route `/organisations` and `/organisations/*` to Next in `scripts/railway-start-landing.cjs`.
- Remove the old Astro `apps/marketing/src/pages/organisations.astro` redirect because `/organisations` is now an actual portal.
- Update docs to explain the split between founder ops and org portal.

Uncommitted files touched/added/deleted in `Newdryve-landing`:

- `app/ops/auth/confirm/route.ts`
- `app/ops/login/page.tsx`
- deleted old `app/organisations/[id]/...` founder pages
- deleted old `app/organisations/api/...` founder API routes
- `app/organisations/layout.tsx`
- `app/organisations/page.tsx`
- `app/organisations/auth/signout/route.ts`
- `app/organisations/denied/page.tsx`
- `app/organisations/login/page.tsx`
- `app/ops/api/organisations/...`
- `app/ops/organisations/...`
- `components/organisations/...`
- `components/ops/NavShell.tsx`
- `components/ops/OrganisationDetailClient.tsx`
- `components/ops/OrganisationsClient.tsx`
- `lib/organisations/...`
- `lib/ops/organisations.ts`
- `middleware.ts`
- `scripts/railway-start-landing.cjs`
- `docs/organisations-app-integration.md`
- `apps/marketing/README.md`
- deleted `apps/marketing/src/pages/organisations.astro`

Local validation of the WIP passed:

- landing Next build
- Astro check
- Astro build

## Recommended next steps

1. Wait for backend CI/Railway to deploy commit `5b9d04f`.
2. Confirm live `/v1/bookings` and `/v1/admin/bookings` no longer 500 from the app.
3. Only after that, review/commit the organisation portal WIP in two commits:
   - backend org-admin support
   - landing isolated org portal
4. Deploy backend first so `/v1/organisations/me` exists.
5. Deploy landing second so `/organisations` can actually call that endpoint.
6. Create one controlled organisation admin account from `/ops/organisations`.
7. Test `/organisations/login` with that account.

