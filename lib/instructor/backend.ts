/**
 * Server-side proxy helpers for the instructor onboarding pages.
 *
 * These routes forward a one-time email token to the product API. They exist
 * so the browser never learns the API origin and so the API's per-IP rate
 * limits can be keyed on the instructor rather than on this service.
 *
 * The origin is read from `process.env` at REQUEST time, deliberately. The
 * Astro versions of these routes read `import.meta.env.NEWDRYVE_API_ORIGIN`,
 * which Vite inlines at BUILD time — the deployed bundle contained a literal
 * empty string, so both endpoints answered 503 forever no matter what Railway
 * held at runtime. Anything read per-request cannot fail that way.
 */
import "server-only";

/**
 * Upper bounds on a call to the product API. Without them a stalled API (a
 * deploy, a Supabase stall) held the connection open forever, and the setup
 * page, which awaits the read during its server render, spun with no way to
 * retry. Writes get longer because they create Stripe objects on the way.
 */
const READ_TIMEOUT_MS = 10_000;
const WRITE_TIMEOUT_MS = 20_000;

function isTimeout(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === "TimeoutError";
}

/**
 * The API's own 429 text is "Rate limit exceeded. Retry after 540s.", which
 * reads as a fault. Instructors get plain minutes instead.
 */
function rateLimitMessage(upstream: Response): string {
  const seconds = Number(upstream.headers.get("retry-after"));
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "Too many attempts in a short time. Please wait a few minutes and try again.";
  }
  const minutes = Math.ceil(seconds / 60);
  return `Too many attempts in a short time. Please wait ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`;
}

/** Same variable the Next rewrites and the working apply route already use. */
export function backendOrigin(): string {
  return (process.env.BACKEND_ORIGIN || "").replace(/\/$/, "");
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

/**
 * The instructor's own address, for the API's per-IP rate limit.
 *
 * Without it the API sees this service's single egress address on every call
 * and rate-limits every instructor together, out of one shared bucket.
 *
 * `X-Real-IP` first: Railway's edge sets it to the address it accepted the
 * connection from, whereas the left-most `X-Forwarded-For` entry is whatever
 * the browser chose to send, so keying on it let anyone reset their limit.
 */
export function forwardedIp(request: { headers: Headers }): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for");
  // Left-most entry is the original client; the rest are proxies.
  return forwarded?.split(",")[0]?.trim() || null;
}

/**
 * Headers naming the instructor to the API. The API only believes a forwarded
 * address from a caller holding the shared ops secret (the proxy secret it
 * also accepts), so without it every instructor shares this service's bucket.
 */
function clientHeaders(ip: string | null | undefined): Record<string, string> {
  const secret = process.env.NEWDRYVE_API_OPS_SECRET || "";
  return {
    ...(ip ? { "x-forwarded-for": ip, "x-real-ip": ip } : {}),
    ...(ip && secret ? { "x-newdryve-proxy-secret": secret } : {}),
  };
}

/** Token shape shared by the membership and payout links. */
export async function readToken(
  request: Request
): Promise<{ token: string } | { error: string; status: number }> {
  let token = "";
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    return { error: "Invalid request.", status: 400 };
  }
  if (token.length < 32 || token.length > 200) {
    return { error: "This link is invalid or has expired.", status: 400 };
  }
  return { token };
}

/**
 * POST a token to the product API and flatten its `{ error: { message } }`
 * envelope to the `{ error: string }` shape these pages render.
 */
export async function postToken(
  request: Request,
  path: string,
  unavailableMessage: string,
  failureMessage: string
): Promise<Response> {
  const origin = backendOrigin();
  if (!origin) {
    console.error(`[instructor] BACKEND_ORIGIN is not set; ${path} unavailable`);
    return json({ error: unavailableMessage }, 503);
  }

  const parsed = await readToken(request);
  if ("error" in parsed) return json({ error: parsed.error }, parsed.status);

  const ip = forwardedIp(request);
  try {
    const upstream = await fetch(`${origin}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...clientHeaders(ip),
      },
      body: JSON.stringify({ token: parsed.token }),
      cache: "no-store",
      signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
    });

    const body = (await upstream.json().catch(() => null)) as
      | { error?: { code?: string; message?: string }; [key: string]: unknown }
      | null;

    if (!upstream.ok) {
      const message =
        upstream.status === 429 ? rateLimitMessage(upstream) : body?.error?.message || failureMessage;
      console.warn(`[instructor] upstream rejected ${path}`, {
        status: upstream.status,
        code: body?.error?.code ?? null,
      });
      return json({ error: message }, upstream.status);
    }
    return json(body);
  } catch (cause) {
    console.error(`[instructor] could not reach ${path}`, cause);
    return json({ error: failureMessage }, isTimeout(cause) ? 504 : 502);
  }
}

/** One task from POST /v1/instructors/onboarding. */
export interface OnboardingTask {
  id: "application" | "verification" | "membership" | "payouts" | "coverage" | "review" | "listing";
  state: "done" | "todo" | "in_review" | "locked" | "blocked";
  title: string;
  detail: string;
  action: "membership_checkout" | "connect_onboarding" | "coverage" | "review_listing" | null;
}

/** Public listing fields to confirm before learners can discover the instructor. */
export interface ListingReview {
  display_name: string | null;
  bio: string | null;
  price_per_hour_pence: number | null;
  transmissions: string[];
  languages: string[];
  specialisms: string[];
  service_city: string | null;
  car_make: string | null;
  car_model: string | null;
  car_color: string | null;
  centres: Array<{ name: string; city: string }>;
  coverage_mode: string | null;
  coverage_value: number | null;
}

/** The centres from their application; the step only asks how far they travel. */
export interface CoverageState {
  mode: string | null;
  value: number | null;
  centres: Array<{ slug: string; name: string; city: string }>;
  suggested_mode: "miles" | "minutes";
  suggested_value: number;
}

export interface OnboardingState {
  display_name: string | null;
  instructor_status: string;
  complete: boolean;
  listed: boolean;
  tasks: OnboardingTask[];
  coverage: CoverageState;
  review: ListingReview;
  membership: {
    monthly_amount_pence: number | null;
    trial_months: number;
    free_forever: boolean;
    status: string;
  };
  payouts: {
    connect_status: string;
    past_due_count: number;
    currently_due_count: number;
    deadline: number | null;
  };
}

/**
 * Read the onboarding task list.
 *
 * A read with no side effects, unlike the helpers above, so it is safe to
 * poll: the hub refreshes after Stripe hands the instructor back, and both
 * sibling endpoints create Stripe objects, so neither could run on a timer.
 * It is still a POST: setup tokens are long-lived credentials, and a token in
 * a query string ends up in the API's and every proxy's access logs.
 *
 * Used twice over — once on the server to render the hub's first paint, and
 * again from the browser on each poll — so it returns parsed data rather than
 * a Response, and the route wraps it.
 */
export async function loadOnboarding(
  token: string,
  ip?: string | null
): Promise<{ state: OnboardingState } | { error: string; status: number }> {
  const origin = backendOrigin();
  if (!origin) {
    console.error("[instructor] BACKEND_ORIGIN is not set; onboarding hub unavailable");
    return { error: "Your setup page is temporarily unavailable.", status: 503 };
  }
  if (token.length < 32 || token.length > 200) {
    return { error: "This link is invalid or has expired.", status: 400 };
  }

  try {
    const upstream = await fetch(`${origin}/v1/instructors/onboarding`, {
      method: "POST",
      headers: { "content-type": "application/json", ...clientHeaders(ip) },
      body: JSON.stringify({ token }),
      cache: "no-store",
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    });
    const body = (await upstream.json().catch(() => null)) as
      | (OnboardingState & { error?: { message?: string } })
      | null;
    if (!upstream.ok || !body) {
      return {
        error:
          upstream.status === 429
            ? rateLimitMessage(upstream)
            : body?.error?.message || "Could not load your setup steps.",
        status: upstream.status || 502,
      };
    }
    return { state: body as OnboardingState };
  } catch (cause) {
    console.error("[instructor] could not reach the onboarding endpoint", cause);
    return {
      error: "Could not load your setup steps. Please try again.",
      status: isTimeout(cause) ? 504 : 502,
    };
  }
}

export async function fetchOnboarding(request: Request, token: string): Promise<Response> {
  const result = await loadOnboarding(token, forwardedIp(request));
  if ("error" in result) return json({ error: result.error }, result.status);
  return json(result.state);
}

/**
 * Save the instructor's first service area.
 *
 * First-time only on the API side: once geometry exists it refuses, and later
 * changes belong to the signed-in editor in the app.
 */
export async function postCoverage(request: Request, body: unknown): Promise<Response> {
  const origin = backendOrigin();
  if (!origin) {
    console.error("[instructor] BACKEND_ORIGIN is not set; coverage save unavailable");
    return json({ error: "Saving your service area is temporarily unavailable." }, 503);
  }

  const ip = forwardedIp(request);
  try {
    const upstream = await fetch(`${origin}/v1/instructors/onboarding/coverage`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        ...clientHeaders(ip),
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
    });
    const payload = (await upstream.json().catch(() => null)) as
      | { error?: { code?: string; message?: string } }
      | null;
    if (!upstream.ok) {
      console.warn("[instructor] upstream rejected the coverage save", {
        status: upstream.status,
        code: payload?.error?.code ?? null,
      });
      return json(
        {
          error:
            upstream.status === 429
              ? rateLimitMessage(upstream)
              : payload?.error?.message || "Could not save your service area.",
        },
        upstream.status
      );
    }
    return json(payload);
  } catch (cause) {
    console.error("[instructor] could not reach the coverage endpoint", cause);
    return json(
      { error: "Could not save your service area. Please try again." },
      isTimeout(cause) ? 504 : 502
    );
  }
}
