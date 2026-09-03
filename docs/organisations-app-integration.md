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
