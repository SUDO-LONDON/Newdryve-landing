import type { APIRoute } from 'astro';

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const apiOrigin = (import.meta.env.NEWDRYVE_API_ORIGIN || '').replace(/\/$/, '');
  if (!apiOrigin) return json({ error: 'Stripe Connect setup is temporarily unavailable.' }, 503);

  let token = '';
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === 'string' ? body.token.trim() : '';
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  if (token.length < 32 || token.length > 200) return json({ error: 'This payout setup link is invalid.' }, 400);

  try {
    const response = await fetch(`${apiOrigin}/v1/instructors/connect/onboard-online`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });
    const body = (await response.json().catch(() => null)) as
      | { client_secret?: string; publishable_key?: string; error?: { message?: string } }
      | null;
    if (!response.ok) {
      return json({ error: body?.error?.message || 'Could not start Stripe Connect setup.' }, response.status);
    }
    return json(body);
  } catch {
    return json({ error: 'Could not reach Stripe Connect setup. Please try again.' }, 502);
  }
};
