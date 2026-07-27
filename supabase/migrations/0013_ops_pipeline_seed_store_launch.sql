-- Newdryve Ops Portal — seed: "Store submission" delivery pipeline.
--
-- This is DATA, not schema. Every node came from a verified finding in the
-- Newdryve app repo audit (week of 2026-07-27), so each `dod` is a concrete,
-- checkable condition rather than a vague objective.
--
-- owner_email is intentionally left NULL. The tracks (frontend/backend/cloud)
-- are the meaningful grouping; assign the actual people in /ops, which also
-- records who accepted each node in the audit log.
--
-- Re-runnable: nodes upsert on `key`, edges on (from_key, to_key). Re-running
-- resets titles/DoD but never clears completion state.

-- ---------------------------------------------------------------------------
-- Nodes
-- ---------------------------------------------------------------------------
insert into public.ops_pipeline_nodes (key, title, detail, dod, track, due_date, position) values

  -- ---------------- CLOUD ----------------
  ('cloud-worker-cron',
   'Deploy worker + cron services',
   'railway.json starts only `node dist/server.js` and CI deploys only `--service api`. backend/src/jobs/index.ts and backend/src/cron/index.ts are separate processes with no deployment config, so nothing consumes app.queues.charges in production.',
   'Three BullMQ queues draining and all five cron jobs firing on schedule, with Redis provisioned at REDIS_URL.',
   'cloud', date '2026-07-27', 10),

  ('cloud-eas-env',
   'Complete eas.json production env',
   'eas.json production profile carries only the Supabase pair. live.js derives LIVE_API_ENABLED from EXPO_PUBLIC_API_URL, so a production build today compiles to a demo-mode app with no backend and no Stripe.',
   '`npm run release:preflight` exits 0 with EXPO_PUBLIC_API_URL and EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY set.',
   'cloud', date '2026-07-27', 20),

  ('cloud-keystore',
   'Android keystore + Google Maps key',
   'Release builds currently fall back to the committed debug keystore. Maps key is still the ANDROID_MAPS_KEY_REQUIRED placeholder.',
   'Upload keystore generated and backed up in the password manager; Maps key restricted to com.newdryve.app plus both SHA-1s.',
   'cloud', date '2026-07-28', 30),

  ('cloud-web-pages',
   'Publish privacy, terms and deletion pages',
   'Auth2.js links hardcode newdryve.com/terms and /privacy at signup. Play additionally requires a public account-deletion URL for the Data Safety form.',
   'All three URLs resolve publicly and are reachable from the signup screen.',
   'cloud', date '2026-07-29', 40),

  ('cloud-stripe-live',
   'Live Stripe webhook + Connect',
   'Stripe events are handled inline by the API process (webhooks/stripe.ts), including the handler that marks a student''s first card default. Without a live endpoint no card is ever recorded.',
   'Endpoint registered at /v1/webhooks/stripe with STRIPE_WEBHOOK_SECRET set, and a payment_method.attached event observed succeeding.',
   'cloud', date '2026-07-28', 50),

  ('cloud-cors',
   'CORS + Supabase redirect allow-list',
   'CORS_ORIGINS is exact-match. Without the deployed origin the site loads but every API call fails.',
   'Web origin present in CORS_ORIGINS and in the Supabase auth redirect allow-list.',
   'cloud', date '2026-07-29', 60),

  ('cloud-eas-init',
   'EAS init + first production builds',
   'app.json has no EAS projectId, so `eas init` has never been run.',
   'projectId written into app.json; a signed .aab and .ipa both build green.',
   'cloud', date '2026-07-28', 70),

  ('cloud-testflight',
   'Builds on TestFlight + Play internal',
   'First real distribution of the shipping artefact to the team.',
   'Every founder can install the build on a real device and sign in.',
   'cloud', date '2026-07-30', 80),

  ('cloud-submit',
   'Submit to both stores',
   'eas.json submit.production is currently an empty object.',
   'App Store Connect and Play Console both show the build in review.',
   'cloud', date '2026-07-31', 90),

  -- ---------------- BACKEND ----------------
  ('be-demo-accounts',
   'Seed store-review demo accounts',
   'STORE_SUBMISSION.md states no review credentials exist in production. Both stores reject without working logins, and review may need both sides of the marketplace.',
   'A student and an instructor account exist via a repeatable script, with a seeded bookable instructor, and are entered in both consoles.',
   'backend', date '2026-07-27', 10),

  ('be-sms-wiring',
   'Wire booking lifecycle to notifications',
   'bookings/index.ts touches only app.queues.charges. The single notification producer is cron/enqueue-due-reminders.ts, so booking, cancellation and reschedule send nothing.',
   'Create, cancel and reschedule each enqueue a Twilio job, verified by a received SMS.',
   'backend', date '2026-07-28', 20),

  ('be-charge-proof',
   'Prove the charge path end to end',
   'The code exists and unit tests are healthy, but nothing proves the money path. Covers completed-lesson, no-show and late-cancel charges.',
   'An integration test in CI drives a completed lesson through to a charge landing on the connected account.',
   'backend', date '2026-07-29', 30),

  ('be-deletion-cascade',
   'Account deletion cascade',
   'DELETE /v1/me de-identifies the profile and cancels upcoming bookings but leaves the Stripe customer behind.',
   'Deleting an account also deletes its Stripe customer, evidenced in the Stripe dashboard.',
   'backend', date '2026-07-30', 40),

  -- ---------------- FRONTEND ----------------
  ('fe-lesson-types',
   'Lesson-types CRUD UI',
   'InstructorSettings2.js tells the instructor to "add them through the live backend". The price stepper mutates local state only and Save persists just price_per_hour_pence. Nothing in the client calls /v1/admin/lesson-types, so a self-served instructor can never become bookable.',
   'An instructor creates, edits and deletes lesson types in-app, price edits survive a reload, and that instructor becomes bookable by a student.',
   'frontend', date '2026-07-28', 10),

  ('fe-connect-verify',
   'Stripe Connect return verification',
   'startStripeConnect opens the browser flow but nothing reconciles the result, so the UI can claim "Connected" when onboarding actually failed.',
   'On return the app polls /v1/admin/connect/status and the UI reflects the true onboarding state.',
   'frontend', date '2026-07-29', 20),

  ('fe-notif-honesty',
   'Notification honesty fix',
   'The preferences screen offers an SMS toggle for booking confirmations and reminders that the backend never sends. The app must not promise what it cannot deliver.',
   'The SMS toggle either sends real messages or is removed. No user-facing promise is left unbacked.',
   'frontend', date '2026-07-29', 30),

  ('fe-confirm-attendance',
   'Wire confirm-attendance',
   'POST /v1/bookings/:id/confirm-attendance exists with no client caller, so a started lesson never leaves its ambiguous state.',
   'A student-facing control calls the endpoint and the booking status visibly advances.',
   'frontend', date '2026-07-30', 40),

  ('fe-blocked-times',
   'Blocked-times UI (cut if slipping)',
   'Backend CRUD exists at /v1/admin/blocked-times with zero client calls. The booking RPC already rejects overlapping blocked times, so the failure mode is a rejected checkout rather than a double-booking — a conversion defect, not data corruption. First thing to cut.',
   'An instructor adds and removes blocked time in-app and the availability grid respects it.',
   'frontend', date '2026-07-31', 50),

  -- ---------------- OPS / QA ----------------
  ('qa-manual-pass',
   'Full manual happy path green',
   'There is no automated end-to-end suite: e2e/ and playwright.config.js do not exist despite CLAUDE.md citing them. Manual is the only safety net, so it runs daily.',
   'One person completes instructor signup, lesson types, availability, Connect, student signup, card, booking, completion and a landed charge — on the TestFlight build.',
   'ops', date '2026-07-30', 10),

  ('ops-go-nogo',
   'Wednesday go/no-go',
   'Decision gate. If the charge path is not proven by end of Wednesday, submit anyway with charging verified manually and treat automated proof as a week-two item.',
   'A recorded go or no-go decision with the cut list agreed.',
   'ops', date '2026-07-29', 20)

on conflict (key) do update set
  title    = excluded.title,
  detail   = excluded.detail,
  dod      = excluded.dod,
  track    = excluded.track,
  due_date = excluded.due_date,
  position = excluded.position;

-- ---------------------------------------------------------------------------
-- Edges: from_key must be done before to_key can start.
-- ---------------------------------------------------------------------------
insert into public.ops_pipeline_edges (from_key, to_key) values
  -- Nothing about the money or notifications is real until the workers run.
  ('cloud-worker-cron', 'cloud-stripe-live'),
  ('cloud-worker-cron', 'be-sms-wiring'),
  ('cloud-worker-cron', 'be-charge-proof'),
  ('cloud-stripe-live', 'be-charge-proof'),
  ('cloud-stripe-live', 'fe-connect-verify'),

  -- The frontend can only tell the truth about SMS once SMS exists.
  ('be-sms-wiring', 'fe-notif-honesty'),

  -- Build chain.
  ('cloud-eas-env',   'cloud-eas-init'),
  ('cloud-eas-env',   'cloud-cors'),
  ('cloud-eas-init',  'cloud-testflight'),
  ('cloud-keystore',  'cloud-testflight'),

  -- QA needs a real build, a bookable instructor and a proven charge.
  ('fe-lesson-types',  'qa-manual-pass'),
  ('be-charge-proof',  'qa-manual-pass'),
  ('cloud-testflight', 'qa-manual-pass'),

  -- The Wednesday gate reads the two things that decide the week.
  ('be-charge-proof', 'ops-go-nogo'),
  ('fe-lesson-types', 'ops-go-nogo'),

  -- Submission is gated on QA, the public pages, review credentials and the call.
  ('qa-manual-pass',   'cloud-submit'),
  ('cloud-web-pages',  'cloud-submit'),
  ('be-demo-accounts', 'cloud-submit'),
  ('ops-go-nogo',      'cloud-submit')
on conflict (from_key, to_key) do nothing;

-- Stamp unlocked_at on everything that starts life ready.
select public.ops_pipeline_refresh_unlocks();
