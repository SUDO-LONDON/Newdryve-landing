# Organisations deployment note

Organisations now have two separate surfaces:

- `/ops/organisations` is founder-only. It creates organisation accounts,
  generates the eight digit instructor join code, and creates organisation admin
  email/password logins.
- `/organisations` is the isolated organisation admin portal. Organisation admins
  sign in with email/password and can only see their own linked instructors,
  lesson presence, lesson totals, and revenue.

The app/backend work in `/Users/kurtishmistry/Documents/Neat/Newdryve` contains:

1. Product database migration for organisations and instructor memberships.
2. Backend endpoints for ops organisation creation, code regeneration, listing,
   organisation admin creation, organisation admin dashboard data, and instructor
   code redemption.
3. `/v1/me` organisation state for the signed-in instructor.
4. `/v1/organisations/me` organisation dashboard data for signed-in organisation
   admins.
5. Instructor Settings UI where an instructor enters the eight digit code.

Required deployment environment:

1. The website must have `NEWDRYVE_API_ORIGIN` set to the product API origin.
2. The website must have `NEWDRYVE_API_OPS_SECRET` set to the same value as the
   backend `OPS_API_SECRET`.
3. The backend must include the founder email in `OPS_FOUNDER_ALLOWLIST`.
4. The website organisation portal must have `NEXT_PUBLIC_PRODUCT_SUPABASE_URL`
   and `NEXT_PUBLIC_PRODUCT_SUPABASE_ANON_KEY` set to the live product Supabase
   project so organisation admins can sign in with their Newdryve auth account.

## Organisations v2 (requires the API from Newdryve#407)

- **Fee terms are Newdryve's.** `/ops/organisations` sets what each school
  charges its instructors, at creation and on the organisation page, through
  `PUT /v1/ops/organisations/:id/fee-terms`. Four modes only: off, lead fee as a
  % of each lesson (`percent_bps`), lead fee as a fixed £ per lesson
  (`amount_pence`), and a flat weekly £ per instructor (`amount_pence`).
  Schools on an earlier mode (`per_hour`, `per_lesson`, `percent_of_revenue`)
  show a "Legacy" badge until ops re-sets them; they are still invoiced.
- **The school portal shows the terms read-only** ("Set by Newdryve") and saves
  only its bank and invoice details. A change to the terms gets 403
  `fee_terms_managed_by_newdryve`.
- **Invoices** for the lead modes list each billed lesson (`line_items`).
- **Member removal** from ops and from the school portal, behind a confirm.
- **Notification bell** in the portal header: instructors joining and leaving,
  polled every 60 seconds while the tab is visible.
- **Listing** fields (bio, https logo URL, `#RRGGBB` brand colour) are edited
  in ops; learners see each organisation as one listing.

## School sick days (requires the API from Newdryve#574, ADR-058)

- **Sick days** on each member row of the portal overview opens a dialog. The
  school gives a sick day for any London day from today, with no upper bound:
  pick a date, see what it would cancel (`GET …/sick-days/preview`), confirm.
  The day closes to bookings, its lessons are cancelled free, each learner is
  told and so is the instructor. The list shows the member's days from today
  with who gave each; the school removes only days it gave (409
  `not_given_by_school` otherwise). Instructors call in sick themselves in the
  app for today and the next 2 days only.
- Proxied through `/organisations/api/members/:instructorId/sick-days`
  (`GET`, `POST`), `…/sick-days/preview?date=` and `…/sick-days/:date`
  (`DELETE`) to `/v1/organisations/instructors/:id/sick-days…`.
