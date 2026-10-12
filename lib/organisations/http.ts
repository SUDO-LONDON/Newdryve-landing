/**
 * Reading error bodies in the browser, for the portal and ops forms.
 *
 * The API's envelope is `{ error: { code, message, details } }`, with the
 * machine-readable reason in `details.code`. The site's own route handlers
 * flatten that to `{ error: string, code?, details? }`. A form that assumed
 * one shape showed "[object Object]" (or nothing) for the other, so every
 * reader goes through here and copes with both. Client-safe.
 */

export interface ApiErrorInfo {
  message: string;
  /** `details.code` when the API gave one, else the envelope's `code`. */
  code: string | null;
  details: Record<string, unknown> | null;
  status: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/** The JSON body, or null when there is none (an HTML error page, an empty 204). */
export async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

export function apiError(body: unknown, status: number, fallback: string): ApiErrorInfo {
  const record = isRecord(body) ? body : {};
  const error = record.error;
  let message = fallback;
  let code: string | null = null;
  let details: Record<string, unknown> | null = isRecord(record.details) ? record.details : null;

  if (typeof error === "string" && error.trim()) {
    message = error;
  } else if (isRecord(error)) {
    if (typeof error.message === "string" && error.message.trim()) message = error.message;
    if (isRecord(error.details)) details = error.details;
    if (typeof error.code === "string") code = error.code;
  }
  if (typeof record.code === "string") code = record.code;
  if (details && typeof details.code === "string") code = details.code;
  return { message, code, details, status };
}

/** An Error that keeps the API's code and details for the caller to branch on. */
export class ApiRequestError extends Error {
  readonly code: string | null;
  readonly details: Record<string, unknown> | null;
  readonly status: number;

  constructor(info: ApiErrorInfo) {
    super(info.message);
    this.code = info.code;
    this.details = info.details;
    this.status = info.status;
  }
}

/**
 * fetch, then the parsed body on success or an ApiRequestError carrying the
 * message and code on failure.
 */
export async function requestJson<T>(input: string, init: RequestInit, fallback: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    throw new ApiRequestError({ message: "Could not reach the server. Check your connection.", code: null, details: null, status: 0 });
  }
  const body = await readJson(response);
  if (!response.ok) throw new ApiRequestError(apiError(body, response.status, fallback));
  return (body ?? {}) as T;
}
