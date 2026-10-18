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

## Cancellation policy (requires the API from Newdryve `feat/cancellation-policy-api`)

- **Settings → Cancellation policy** sets one policy per school, for every
  instructor in it: free cancellation up to `notice_hours` (2, 6, 12, 24, 48 or
  72) before a lesson, then `late_fee_bps` (0, 5000 or 10000: no fee, half or
  the full lesson price). The fixed rules are shown read-only: inside 30 minutes
  a learner pays the full price, and instructors can cancel for free up to 30
  minutes before. A change only reaches lessons booked after it.
- `/organisations/api/cancellation-policy` proxies `GET` and `PUT
  /v1/organisations/me/cancellation-policy` with the admin's session, and sends
  `organisation_id` as the billing form does. The `PUT` body is checked against
  the allowed values and rebuilt before it is forwarded.
- Against an API without the endpoint (404) the section shows the standard
  policy (24 hours, half price) with a "not available yet" note and no Save.
