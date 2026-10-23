/**
 * Emails an instructor applicant a six-digit code that proves they own the
 * address they are applying with.
 *
 * The API creates nothing for an application until the code it emailed comes
 * back with it (Newdryve API ADR-056), so nobody can register someone else's
 * address. The form asks for the code when the applicant presses Continue on
 * the sign-in step, then sends it as `email_verification_code` with the
 * application. This proxies the API's public
 * POST /v1/instructors/apply/verify-email, keyed on the applicant's own address
 * for its rate limit (5 an hour per caller, one code a minute per address).
 *
 * Request:  POST { email }
 * Response: 200 { status: 'sent', expires_in_seconds }
 *           | 200 { status: 'not_required' } when the API predates the code (no route)
 *           | 409 { error, field: 'email' } when the email already has an account
 *           | 409 { error, code: 'cooldown' } when a code went out under a minute ago
 *           | 400 { error } | 429 { error } | 502 { error } | 503 { error }
 */
import type { APIRoute } from 'astro';
import { json } from '../../lib/email';
import { applicantIp, backendOrigin, forwardedHeaders, isTimeout } from '../../lib/instructor-api';

// Reads a server-only origin, so this route is never prerendered.
export const prerender = false;

/** The API sends the email inside the call; the applicant is waiting on Continue. */
const UPSTREAM_TIMEOUT_MS = 10_000;

const tooManyMessage = (upstream: Response): string => {
  const seconds = Number(upstream.headers.get('retry-after'));
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'Too many codes have been requested from your connection. Please try again later.';
  }
  const minutes = Math.ceil(seconds / 60);
  return minutes < 60
    ? `Too many codes have been requested from your connection. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
    : 'Too many codes have been requested from your connection. Please try again in an hour.';
};

export const POST: APIRoute = async (context) => {
  const origin = backendOrigin();
  if (!origin) {
    console.error('[instructor-email-code] BACKEND_ORIGIN is not set');
    return json({ error: 'Applications are temporarily unavailable. Please try again shortly.' }, 503);
  }

  let email = '';
  try {
    const body = (await context.request.json()) as { email?: unknown };
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  if (!email || email.length > 254 || !email.includes('@')) {
    return json({ error: 'Enter a valid email address.', field: 'email' }, 400);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${origin}/v1/instructors/apply/verify-email`, {
      method: 'POST',
      headers: forwardedHeaders(applicantIp(context)),
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    console.warn('[instructor-email-code] upstream unavailable', err);
    return json(
      {
        error: isTimeout(err)
          ? 'This is taking longer than it should. Check your inbox for the code, or try again in a minute.'
          : "We couldn't email you a code just now. Please try again in a moment.",
      },
      502
    );
  }

  const body = (await upstream.json().catch(() => null)) as
    | { status?: unknown; expires_in_seconds?: unknown; error?: { code?: string; message?: string } }
    | null;

  // An API from before ADR-056 has no such route and takes applications
  // without a code. Saying so lets this site go live ahead of that API change
  // instead of stranding applicants on the sign-in step.
  if (upstream.status === 404) return json({ status: 'not_required' });

  if (upstream.ok) {
    return json({
      status: 'sent',
      expires_in_seconds: typeof body?.expires_in_seconds === 'number' ? body.expires_in_seconds : 1800,
    });
  }

  const apiMessage = body?.error?.message ?? '';
  if (upstream.status === 409 && /already exists/i.test(apiMessage)) {
    return json(
      {
        error:
          'An account with this email address already exists. If it’s yours, sign in to the Newdryve app, or use a different email to apply.',
        field: 'email',
      },
      409
    );
  }
  if (upstream.status === 409) {
    return json(
      { error: 'We emailed you a code less than a minute ago. Enter that one, or wait a minute and send a new one.', code: 'cooldown' },
      409
    );
  }
  if (upstream.status === 429) return json({ error: tooManyMessage(upstream) }, 429);
  if (upstream.status === 422 || upstream.status === 400) {
    return json({ error: 'Enter a valid email address.', field: 'email' }, 422);
  }

  console.warn('[instructor-email-code] upstream rejected', {
    status: upstream.status,
    code: body?.error?.code ?? null,
    message: apiMessage || null,
  });
  return json({ error: "We couldn't email you a code just now. Please try again in a moment." }, 502);
};
