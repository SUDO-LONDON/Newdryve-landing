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
 * Request:  POST { full_name, email, password, ...application fields, documents[] }
 * Response: 201 { status, instructor_id, uploads[], message }
 *           | 409 { error } when the email already has an account
 *           | 422 { error, issues } | 429 { error } | 502 { error }
 */
import type { APIRoute } from 'astro';
import { json } from '../../lib/email';

// Reads a server-only origin, so this route is never prerendered.
export const prerender = false;

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN?.replace(/\/$/, '') || '';

/** Generous cap; the real field-by-field validation is the API's job. */
const MAX_BODY_BYTES = 64 * 1024;

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

/**
 * The applicant's address, for the API's per-IP rate limit. `clientAddress` is
 * the node adapter's `x-forwarded-for` value (Railway's edge sets it), falling
 * back to the socket peer, and throws rather than returning null on an adapter
 * that cannot supply one — hence the guard.
 */
const applicantIp = (context: { clientAddress: string }): string | null => {
  try {
    // Read lazily: `clientAddress` is a getter, so destructuring it up front
    // would throw before the handler could fall back to the shared limit.
    const address = context.clientAddress;
    return address ? address.trim() : null;
  } catch {
    return null;
  }
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

  const validationError = validateApplication(payload);
  if (validationError) return json({ error: validationError }, 422);

  // Without this the API sees this service's egress address on every call and
  // rate-limits all applicants together, five an hour between them.
  const ip = applicantIp(context);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ip) {
    headers['x-forwarded-for'] = ip;
    headers['x-real-ip'] = ip;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_ORIGIN}/v1/instructors/apply`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[instructor-apply] upstream unreachable', err);
    return json(
      { error: "We couldn't submit your application just now. Please try again in a moment." },
      502
    );
  }

  const body = (await upstream.json().catch(() => null)) as
    | { error?: { code?: string; message?: string; details?: unknown }; [key: string]: unknown }
    | null;

  if (!upstream.ok) {
    // The API's error envelope is { error: { code, message, details } }. Flatten
    // it to the { error: string } shape the rest of this site's forms use.
    const message =
      upstream.status === 429
        ? rateLimitMessage(upstream)
        : body?.error?.message ||
          "We couldn't submit your application. Please check your details.";
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
    return json({ error: message }, upstream.status);
  }

  return json(body ?? {}, upstream.status);
};
