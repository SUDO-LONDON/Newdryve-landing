/**
 * Shared server-side helpers for the routes that proxy the instructor
 * application onto the live API (POST /v1/instructors/apply and the early
 * duplicate-email check).
 */

/** Live API origin, read per request rather than inlined at build time. */
export const backendOrigin = (): string => process.env.BACKEND_ORIGIN?.replace(/\/$/, '') || '';

/**
 * The applicant's address, for the API's per-IP rate limit.
 *
 * `X-Real-IP` first: Railway's edge sets it to the address it accepted the
 * connection from. `clientAddress` is the node adapter's left-most
 * `x-forwarded-for` value, which the browser can write itself, so it is only
 * the fallback; it throws rather than returning null on an adapter that cannot
 * supply one — hence the guard.
 */
export const applicantIp = (context: { request: Request; clientAddress: string }): string | null => {
  const realIp = context.request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  try {
    // Read lazily: `clientAddress` is a getter, so destructuring it up front
    // would throw before the handler could fall back to the shared limit.
    const address = context.clientAddress;
    return address ? address.trim() : null;
  } catch {
    return null;
  }
};

/**
 * Headers that key the API's rate limit on the applicant, not on this service.
 * The API only believes a forwarded address from a caller presenting the
 * shared ops secret (the same NEWDRYVE_API_OPS_SECRET the /ops service uses);
 * without it every applicant shares one bucket of five applications an hour.
 */
export const forwardedHeaders = (ip: string | null): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const secret = process.env.NEWDRYVE_API_OPS_SECRET || '';
  if (ip) {
    headers['x-forwarded-for'] = ip;
    headers['x-real-ip'] = ip;
    if (secret) headers['x-newdryve-proxy-secret'] = secret;
  }
  return headers;
};

export const isTimeout = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'TimeoutError';
