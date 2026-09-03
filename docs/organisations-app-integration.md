# Organisations deployment note

The founder-only `/organisations` area is wired to the live Newdryve product API.
It creates organisation accounts, generates an eight digit join code, and reads
linked instructors, lesson presence, lesson totals, and revenue from app data.

The app/backend work in `/Users/kurtishmistry/Documents/Neat/Newdryve` contains:

1. Product database migration for organisations and instructor memberships.
2. Backend endpoints for ops organisation creation, code regeneration, listing, and
   instructor code redemption.
3. `/v1/me` organisation state for the signed-in instructor.
4. Instructor Settings UI where an instructor enters the eight digit code.

Required deployment environment:

1. The website must have `NEWDRYVE_API_ORIGIN` set to the product API origin.
2. The website must have `NEWDRYVE_API_OPS_SECRET` set to the same value as the
   backend `OPS_API_SECRET`.
3. The backend must include the founder email in `OPS_FOUNDER_ALLOWLIST`.
