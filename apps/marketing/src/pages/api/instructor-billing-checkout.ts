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
  if (!apiOrigin) return json({ error: 'Membership setup is temporarily unavailable.' }, 503);

  let token = '';
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === 'string' ? body.token.trim() : '';
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  if (token.length < 32 || token.length > 200) return json({ error: 'This membership link is invalid.' }, 400);

  try {
    const response = await fetch(`${apiOrigin}/v1/instructors/billing/checkout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });
    const body = (await response.json().catch(() => null)) as
      | { checkout_url?: string; already_active?: boolean; app_url?: string; error?: { message?: string } }
      | null;
    if (!response.ok) {
      return json({ error: body?.error?.message || 'Could not start membership setup.' }, response.status);
    }
    return json(body);
  } catch {
    return json({ error: 'Could not reach membership setup. Please try again.' }, 502);
  }
};
