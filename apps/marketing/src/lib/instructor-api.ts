/**
 * Shared server-side helpers for the routes that proxy the instructor
 * application onto the live API (POST /v1/instructors/apply and the early
 * duplicate-email check).
 */

/** Live API origin, read per request rather than inlined at build time. */
export const backendOrigin = (): string => process.env.BACKEND_ORIGIN?.replace(/\/$/, '') || '';

/**
 * The applicant's address, for the API's per-IP rate limit. `clientAddress` is
 * the node adapter's `x-forwarded-for` value (Railway's edge sets it), falling
 * back to the socket peer, and throws rather than returning null on an adapter
 * that cannot supply one — hence the guard.
 */
export const applicantIp = (context: { clientAddress: string }): string | null => {
  try {
    // Read lazily: `clientAddress` is a getter, so destructuring it up front
    // would throw before the handler could fall back to the shared limit.
    const address = context.clientAddress;
    return address ? address.trim() : null;
  } catch {
    return null;
  }
};

/** Headers that key the API's rate limit on the applicant, not on this service. */
export const forwardedHeaders = (ip: string | null): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ip) {
    headers['x-forwarded-for'] = ip;
    headers['x-real-ip'] = ip;
  }
  return headers;
};

export const isTimeout = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'TimeoutError';
