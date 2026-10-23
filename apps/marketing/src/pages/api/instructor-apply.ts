/**
 * Instructor application intake.
 *
 * A thin server-side proxy onto the live API's POST /v1/instructors/apply. All
 * validation, account creation and email sending happen there — this exists so
 * the browser talks to its own origin (no CORS negotiation from the marketing
 * site) and so BACKEND_ORIGIN stays a server-side detail.
 *
 * An optional ADI badge image does not pass through here. The API replies with
 * a short-lived signed upload URL and the browser PUTs it directly to private
 * Supabase Storage.
 *
 * The API rate-limits this endpoint per caller IP (5/hour). Because the call is
 * made server-to-server, every applicant would otherwise share this service's
 * single egress IP and one global bucket of five applications an hour, so the
 * applicant's own address is forwarded and the limit is keyed on them instead.
 *
 * Request:  POST { full_name, email, password, email_verification_code, ...application
 *           fields, gender?, documents[] }
 *           `gender` is optional and private: 'female' | 'male' | 'non_binary' | null.
 *           `email_verification_code` is the six digits /api/instructor-email-code
 *           had the API email to `email`; the API creates nothing without it. It
 *           is absent only while the API asks for no code, and the API enforces it.
 * Response: 201 { status, instructor_id, uploads[], message }
 *           | 409 { error, field: 'email' } when the email already has an account
 *           | 422 { error, field: 'email_verification_code' } when the code is wrong,
 *             expired or used up
 *           | 422 { error, field? } | 429 { error } | 502 { error } | 504 { error }
 *
 * `field` names the application field the API rejected, so the form can take
 * the applicant back to it instead of showing a bare "invalid body".
 */
import type { APIRoute } from 'astro';
import { json } from '../../lib/email';
import { applicantIp, backendOrigin, forwardedHeaders, isTimeout } from '../../lib/instructor-api';

// Reads a server-only origin, so this route is never prerendered.
export const prerender = false;

/** Generous cap; the real field-by-field validation is the API's job. */
const MAX_BODY_BYTES = 64 * 1024;

/**
 * Account creation, the application RPC and two emails happen inside one API
 * call, so this is generous. It still ends: a stalled API used to leave the
 * applicant on "Submitting..." forever.
 */
const UPSTREAM_TIMEOUT_MS = 30_000;

/** The content types the API (and the storage bucket) accept for the badge. */
const DOCUMENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
  'application/pdf',
]);

/**
 * Hidden field real applicants never see or fill. Anything in it is a bot, which
 * gets an ordinary-looking success without an account being created.
 */
const HONEYPOT_FIELD = 'apply_reference';

/** How each API field is named on the form, for the applicant's error message. */
const FIELD_LABELS: Record<string, string> = {
  full_name: 'Full name',
  email: 'Email',
  email_verification_code: 'Email code',
  password: 'Password',
  phone_e164: 'Mobile number',
  gender: 'Gender',
  driving_school_name: 'Driving school name',
  bio: 'Short bio',
  price_per_hour_pounds: 'Price per hour',
  transmissions: 'Transmission',
  languages: 'Languages',
  specialisms: 'Specialisms',
  test_centre_slugs: 'Test centres',
  car_make: 'Car make',
  car_model: 'Car model',
  car_color: 'Car colour',
  adi_number: 'ADI badge number',
  adi_badge_expires_on: 'ADI badge expiry',
  dvsa_verification_consent: 'DVSA check permission',
  application_notes: 'Anything else we should know',
  lesson_types: 'Lesson lengths',
  weekly_availability: 'Availability',
  documents: 'ADI badge image',
};

/** For a rejected item inside a list, e.g. one specialism out of several. */
const ITEM_LABELS: Record<string, string> = {
  specialisms: 'Each specialism',
  languages: 'Each language',
  weekly_availability: 'Each available day',
};

type ApiIssue = {
  code?: unknown;
  path?: unknown;
  maximum?: unknown;
  minimum?: unknown;
  type?: unknown;
};

/**
 * Turn the API's first zod issue into a message the applicant can act on. The
 * API itself only says "invalid body", with the detail in `details.issues`.
 */
const describeIssue = (details: unknown): { field: string; message: string } | null => {
  if (!details || typeof details !== 'object') return null;
  const issues = (details as { issues?: unknown }).issues;
  if (!Array.isArray(issues) || issues.length === 0) return null;
  const issue = issues[0] as ApiIssue;
  const path = Array.isArray(issue.path) ? issue.path : [];
  const field = typeof path[0] === 'string' ? path[0] : '';
  const label = FIELD_LABELS[field];
  if (!label) return null;

  const isItem = typeof path[1] === 'number';
  const subject = isItem ? ITEM_LABELS[field] ?? label : label;
  const maximum = typeof issue.maximum === 'number' ? issue.maximum : null;
  const minimum = typeof issue.minimum === 'number' ? issue.minimum : null;

  if (issue.code === 'too_big' && maximum !== null) {
    if (issue.type === 'string') return { field, message: `${subject} must be ${maximum} characters or fewer.` };
    if (issue.type === 'array') return { field, message: `${label}: choose no more than ${maximum}.` };
    if (issue.type === 'number') return { field, message: `${label} must be no more than ${maximum}.` };
  }
  if (issue.code === 'too_small' && minimum !== null && issue.type === 'string') {
    return { field, message: `${subject} must be at least ${minimum} characters.` };
  }
  return { field, message: `Please check this answer: ${label}.` };
};

/**
 * The only values the API takes for the optional, private `gender`. Absent,
 * null or "" (the form's "Prefer not to say") all mean not stated.
 */
const GENDER_VALUES = ['female', 'male', 'non_binary'] as const;

/** Null when `gender` is absent, unstated or one of GENDER_VALUES; otherwise the applicant's message. */
const validateGender = (gender: unknown): string | null =>
  gender === undefined ||
  gender === null ||
  gender === '' ||
  (typeof gender === 'string' && (GENDER_VALUES as readonly string[]).includes(gender))
    ? null
    : 'Choose female, male, non-binary or prefer not to say for gender.';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isFilledString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isFilledArray = (value: unknown): value is unknown[] =>
  Array.isArray(value) && value.length > 0;

const isStrongPassword = (value: string): boolean =>
  value.length >= 8 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /\d/.test(value) &&
  /[^A-Za-z0-9]/.test(value);

const validateApplication = (payload: unknown): string | null => {
  if (!isRecord(payload)) return 'Invalid request body.';

  const requiredText = [
    'full_name',
    'email',
    'password',
    'phone_e164',
    'driving_school_name',
    'bio',
    'car_make',
    'car_model',
    'car_color',
    'adi_number',
    'adi_badge_expires_on',
    'application_notes',
  ];
  if (requiredText.some((key) => !isFilledString(payload[key]))) {
    return 'Please complete every field before submitting.';
  }

  if (!/^\+447\d{9}$/.test(String(payload.phone_e164))) {
    return 'Enter a valid UK mobile number beginning 07 or +44 7.';
  }
  if (!isStrongPassword(String(payload.password))) {
    return 'Use 8 or more password characters with uppercase, lowercase, a number and a symbol.';
  }
  if (
    typeof payload.price_per_hour_pounds !== 'number' ||
    !Number.isFinite(payload.price_per_hour_pounds) ||
    payload.price_per_hour_pounds <= 0
  ) {
    return 'Enter a valid hourly price.';
  }
  if (
    !isFilledArray(payload.transmissions) ||
    !isFilledArray(payload.languages) ||
    !isFilledArray(payload.specialisms) ||
    !isFilledArray(payload.test_centre_slugs)
  ) {
    return 'Choose at least one transmission, language, specialism and test centre.';
  }

  if (!isRecord(payload.lesson_types)) return 'Choose at least one lesson length.';
  const lessonTypes = payload.lesson_types;
  if (!lessonTypes['1h'] && !lessonTypes['90m'] && !lessonTypes['2h']) {
    return 'Choose at least one lesson length.';
  }
  if (!isFilledArray(payload.weekly_availability)) {
    return 'Choose at least one day you are available.';
  }
  if (payload.dvsa_verification_consent !== true) {
    return 'Please authorise Newdryve to verify your current DVSA registration.';
  }
  if (String(payload.adi_badge_expires_on) < new Date().toISOString().slice(0, 10)) {
    return 'Your ADI badge must still be current.';
  }
  if (!Array.isArray(payload.documents)) return 'Invalid supporting document selection.';
  if (payload.documents.some((document) => !isRecord(document) || document.kind !== 'adi')) {
    return 'Only an optional ADI badge image can be attached.';
  }

  return null;
};

/** "Retry after 3531s." is the API's wording; applicants need plain minutes. */
const rateLimitMessage = (upstream: Response): string => {
  const seconds = Number(upstream.headers.get('retry-after'));
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'Too many applications have been submitted from your connection. Please try again later.';
  }
  const minutes = Math.ceil(seconds / 60);
  return minutes < 60
    ? `Too many applications have been submitted from your connection. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
    : 'Too many applications have been submitted from your connection. Please try again in an hour.';
};

export const POST: APIRoute = async (context) => {
  const { request } = context;
  const BACKEND_ORIGIN = backendOrigin();

  if (!BACKEND_ORIGIN) {
    console.error('[instructor-apply] BACKEND_ORIGIN is not set');
    return json(
      { error: 'Applications are temporarily unavailable. Please try again shortly.' },
      503
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: 'That application is too large to submit.' }, 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  // A bot filled the hidden field. Answer as if it worked, so it learns
  // nothing, but create no account and send no email.
  const trap = isRecord(payload) ? payload[HONEYPOT_FIELD] : undefined;
  if (typeof trap === 'string' && trap.trim()) {
    console.warn('[instructor-apply] honeypot filled; application discarded');
    return json({ status: 'pending', uploads: [] }, 201);
  }

  const validationError = validateApplication(payload);
  if (validationError) return json({ error: validationError }, 422);
  const code = (payload as Record<string, unknown>).email_verification_code;
  const codeSent = code !== undefined && code !== null && code !== '';
  if (codeSent && (typeof code !== 'string' || !/^\d{6}$/.test(code.trim()))) {
    return json(
      { error: 'Enter the 6-digit code we emailed you.', field: 'email_verification_code' },
      422
    );
  }
  const genderError = validateGender((payload as Record<string, unknown>).gender);
  if (genderError) return json({ error: genderError, field: 'gender' }, 422);

  const application = { ...(payload as Record<string, unknown>) };
  delete application[HONEYPOT_FIELD];
  if (!codeSent) delete application.email_verification_code;
  // "Prefer not to say" is null to the API, never an empty string.
  if (application.gender === '' || application.gender === undefined) application.gender = null;
  // The badge is optional, and the API rejects the WHOLE application over one
  // unsupported content type (a .heic from Chrome on Windows reports no type
  // at all). Drop it instead; the form then shows its upload warning.
  application.documents = (application.documents as Array<Record<string, unknown>>).filter(
    (document) => typeof document.content_type === 'string' && DOCUMENT_TYPES.has(document.content_type)
  );

  // Without this the API sees this service's egress address on every call and
  // rate-limits all applicants together, five an hour between them.
  const ip = applicantIp(context);

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_ORIGIN}/v1/instructors/apply`, {
      method: 'POST',
      headers: forwardedHeaders(ip),
      body: JSON.stringify(application),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    console.error('[instructor-apply] upstream unreachable', err);
    if (isTimeout(err)) {
      // The API may still have created the account, so a blind retry could
      // collide with it. Point them at the confirmation email first.
      return json(
        {
          error:
            'This is taking longer than it should. Check your inbox for a confirmation email before trying again.',
        },
        504
      );
    }
    return json(
      { error: "We couldn't submit your application just now. Please try again in a moment." },
      502
    );
  }

  const body = (await upstream.json().catch(() => null)) as
    | { error?: { code?: string; message?: string; details?: unknown }; [key: string]: unknown }
    | null;

  if (!upstream.ok) {
    // The API refused the email code: wrong, expired, or out of guesses. It
    // created nothing, so the applicant fixes the code and submits again.
    const details = body?.error?.details as { code?: unknown } | undefined;
    if (upstream.status === 422 && details?.code === 'email_verification_failed') {
      return json(
        {
          error:
            'That email code is wrong or has expired. Check you typed the latest code we sent, or send a new one.',
          field: 'email_verification_code',
        },
        422
      );
    }

    // The API's error envelope is { error: { code, message, details } }. Flatten
    // it to the { error: string } shape the rest of this site's forms use.
    const issue = upstream.status === 429 ? null : describeIssue(body?.error?.details);
    const apiMessage = body?.error?.message;
    const message =
      upstream.status === 429
        ? rateLimitMessage(upstream)
        : issue?.message ||
          // "invalid body" is the API's catch-all and means nothing to an
          // applicant; anything more specific is passed through.
          (apiMessage && apiMessage !== 'invalid body'
            ? apiMessage
            : "We couldn't submit your application. Please check your details.");
    const field =
      issue?.field ?? (upstream.status === 409 && /email/i.test(apiMessage ?? '') ? 'email' : undefined);
    // The message alone cannot tell a rejected field from a failure inside the
    // API's handler, so log the code and details too — they are the only record
    // this side keeps of why an application was turned away. The applicant's
    // own answers are deliberately not logged.
    console.warn('[instructor-apply] upstream rejected', {
      status: upstream.status,
      code: body?.error?.code ?? null,
      message,
      details: body?.error?.details ?? null,
    });
    return json(field ? { error: message, field } : { error: message }, upstream.status);
  }

  return json(body ?? {}, upstream.status);
};
