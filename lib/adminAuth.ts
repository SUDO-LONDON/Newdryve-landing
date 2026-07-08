import { createHmac, timingSafeEqual } from 'crypto';

// Shared-password gate for /admin/*. One password for the whole team,
// signed cookie session — no per-user accounts, no database.
export const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set');
  const expires = String(Date.now() + SESSION_TTL_MS);
  return `${expires}.${sign(expires, secret)}`;
}

// Returns false (rather than throwing) when ADMIN_SESSION_SECRET is missing,
// so a misconfigured deploy locks /admin/* out instead of 500ing on every request.
export function verifySessionToken(token: string | undefined): boolean {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token) return false;

  const [expires, signature] = token.split('.');
  if (!expires || !signature) return false;
  if (Date.now() > Number(expires)) return false;

  const expected = sign(expires, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Returns false (rather than throwing) when ADMIN_PASSWORD is missing, so a
// misconfigured deploy rejects every login attempt instead of 500ing.
export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
