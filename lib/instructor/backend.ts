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
 */
export function forwardedIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Left-most entry is the original client; the rest are proxies.
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || null;
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
        ...(ip ? { "x-forwarded-for": ip, "x-real-ip": ip } : {}),
      },
      body: JSON.stringify({ token: parsed.token }),
      cache: "no-store",
    });

    const body = (await upstream.json().catch(() => null)) as
      | { error?: { code?: string; message?: string }; [key: string]: unknown }
      | null;

    if (!upstream.ok) {
      const message = body?.error?.message || failureMessage;
      console.warn(`[instructor] upstream rejected ${path}`, {
        status: upstream.status,
        code: body?.error?.code ?? null,
      });
      return json({ error: message }, upstream.status);
    }
    return json(body);
  } catch (cause) {
    console.error(`[instructor] could not reach ${path}`, cause);
    return json({ error: failureMessage }, 502);
  }
}

/** One task from GET /v1/instructors/onboarding. */
export interface OnboardingTask {
  id: "application" | "verification" | "membership" | "payouts" | "coverage" | "listing";
  state: "done" | "todo" | "in_review" | "locked" | "blocked";
  title: string;
  detail: string;
  action: "membership_checkout" | "connect_onboarding" | "open_app" | null;
}

export interface OnboardingState {
  display_name: string | null;
  instructor_status: string;
  complete: boolean;
  listed: boolean;
  tasks: OnboardingTask[];
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
 * A GET, unlike the POST helpers above, because this one is polled: the hub
 * refreshes after Stripe hands the instructor back, and both sibling endpoints
 * create Stripe objects as a side effect, so neither could be called on a
 * timer.
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
    const upstream = await fetch(
      `${origin}/v1/instructors/onboarding?token=${encodeURIComponent(token)}`,
      {
        headers: ip ? { "x-forwarded-for": ip, "x-real-ip": ip } : undefined,
        cache: "no-store",
      }
    );
    const body = (await upstream.json().catch(() => null)) as
      | (OnboardingState & { error?: { message?: string } })
      | null;
    if (!upstream.ok || !body) {
      return {
        error: body?.error?.message || "Could not load your setup steps.",
        status: upstream.status || 502,
      };
    }
    return { state: body as OnboardingState };
  } catch (cause) {
    console.error("[instructor] could not reach the onboarding endpoint", cause);
    return { error: "Could not load your setup steps. Please try again.", status: 502 };
  }
}

export async function fetchOnboarding(request: Request, token: string): Promise<Response> {
  const result = await loadOnboarding(token, forwardedIp(request));
  if ("error" in result) return json({ error: result.error }, result.status);
  return json(result.state);
}
