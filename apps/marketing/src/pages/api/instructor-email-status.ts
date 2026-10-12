/**
 * Early duplicate-email check for the instructor application form.
 *
 * The API refuses an application whose email already has an account, but the
 * form only learned that on its last step, three steps after the email field.
 * This lets the form ask as the applicant leaves the sign-in step. It proxies
 * the API's public POST /v1/auth/email-status (rate-limited per caller), which
 * runs the same profile lookup as the apply endpoint's own duplicate check.
 *
 * Request:  POST { email }
 * Response: 200 { exists: boolean } | 4xx/5xx { error }
 *
 * Advisory only: the form carries on if this fails, and the apply endpoint
 * still enforces the rule.
 */
import type { APIRoute } from 'astro';
import { json } from '../../lib/email';
import { applicantIp, backendOrigin, forwardedHeaders } from '../../lib/instructor-api';

// Reads a server-only origin, so this route is never prerendered.
export const prerender = false;

export const POST: APIRoute = async (context) => {
  const origin = backendOrigin();
  if (!origin) return json({ error: 'Unavailable.' }, 503);

  let email = '';
  try {
    const body = (await context.request.json()) as { email?: unknown };
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  if (!email || email.length > 254 || !email.includes('@')) {
    return json({ error: 'Enter a valid email address.' }, 400);
  }

  try {
    const upstream = await fetch(`${origin}/v1/auth/email-status`, {
      method: 'POST',
      headers: forwardedHeaders(applicantIp(context)),
      body: JSON.stringify({ email }),
      // The applicant is waiting on the Continue button; give up quickly.
      signal: AbortSignal.timeout(5_000),
    });
    const body = (await upstream.json().catch(() => null)) as { exists?: unknown } | null;
    if (!upstream.ok || typeof body?.exists !== 'boolean') {
      return json({ error: 'Could not check that email.' }, upstream.ok ? 502 : upstream.status);
    }
    return json({ exists: body.exists });
  } catch (err) {
    console.warn('[instructor-email-status] upstream unavailable', err);
    return json({ error: 'Could not check that email.' }, 502);
  }
};
