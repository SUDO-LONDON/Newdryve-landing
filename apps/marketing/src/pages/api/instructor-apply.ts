/**
 * Instructor application intake.
 *
 * A thin server-side proxy onto the live API's POST /v1/instructors/apply. All
 * validation, account creation and email sending happen there — this exists so
 * the browser talks to its own origin (no CORS negotiation from the marketing
 * site) and so BACKEND_ORIGIN stays a server-side detail.
 *
 * Certificate files do NOT pass through here. The API replies with short-lived
 * signed upload URLs and the browser PUTs each file straight to Supabase
 * Storage, keeping multi-megabyte phone photos off both this service and the
 * API.
 *
 * Request:  POST { full_name, email, password, ...application fields, documents[] }
 * Response: 201 { status, instructor_id, uploads[], message }
 *           | 409 { error } when the email already has an account
 *           | 422 { error, issues } | 502 { error }
 */
import type { APIRoute } from 'astro';
import { json } from '../../lib/email';

// Reads a server-only origin, so this route is never prerendered.
export const prerender = false;

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN?.replace(/\/$/, '') || '';

/** Generous cap; the real field-by-field validation is the API's job. */
const MAX_BODY_BYTES = 64 * 1024;

export const POST: APIRoute = async ({ request }) => {
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

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_ORIGIN}/v1/instructors/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    | { error?: { message?: string }; [key: string]: unknown }
    | null;

  if (!upstream.ok) {
    // The API's error envelope is { error: { code, message, details } }. Flatten
    // it to the { error: string } shape the rest of this site's forms use.
    const message =
      body?.error?.message || "We couldn't submit your application. Please check your details.";
    console.warn('[instructor-apply] upstream rejected', upstream.status, message);
    return json({ error: message }, upstream.status);
  }

  return json(body ?? {}, upstream.status);
};
