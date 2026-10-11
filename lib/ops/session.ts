// Signed values that let the /ops middleware vouch for a founder without
// calling Supabase on every request.
//
// The key is OPS_SESSION_SECRET and nothing else. It used to fall back to the
// Supabase service-role key and then to the anon key, which ships to every
// browser, so a deployment missing the service key let anyone mint a founder
// cookie. Now an unset or short secret disables the fast path entirely: every
// request is checked against Supabase instead, which is slower but never
// trusts a value a visitor could have signed themselves.

const VERIFIED_COOKIE = "ops_verified";

/** Request header carrying proof that middleware set x-ops-founder-email. */
const FOUNDER_PROOF_HEADER = "x-ops-founder-proof";

/**
 * How long one successful Supabase check vouches for a founder. The cookie is
 * NOT re-issued by the fast path, so a revoked Supabase session (or a founder
 * removed from the allowlist) loses access within this window even while they
 * keep clicking.
 */
const OPS_REVERIFY_MS = 10 * 60 * 1000;

/** 32 bytes of entropy, e.g. `openssl rand -base64 32` (44 characters). */
const MIN_SECRET_LENGTH = 32;

const encoder = new TextEncoder();
let warnedMissingSecret = false;

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function secret(): string | null {
  const value = process.env.OPS_SESSION_SECRET || "";
  if (value.length >= MIN_SECRET_LENGTH) return value;
  if (!warnedMissingSecret) {
    warnedMissingSecret = true;
    console.warn(
      `[ops/session] OPS_SESSION_SECRET is unset or shorter than ${MIN_SECRET_LENGTH} characters; ` +
        "every /ops request will be re-checked against Supabase."
    );
  }
  return null;
}

/** Whether signed founder cookies and headers are available at all. */
export function isOpsSessionSigningConfigured(): boolean {
  return secret() !== null;
}

async function sign(value: string): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
  return base64Url(new Uint8Array(signature));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * `<email>.<verifiedAt>.<signature>`, minted only after Supabase has confirmed
 * the session. Null when no signing secret is configured.
 */
export async function createVerifiedFounderCookie(email: string): Promise<string | null> {
  const payload = `${email.trim().toLowerCase()}.${Date.now()}`;
  const signature = await sign(payload);
  return signature ? `${payload}.${signature}` : null;
}

/** The founder a cookie vouches for, or null if it is forged, stale or absent. */
export async function readVerifiedFounderCookie(value: string | undefined): Promise<string | null> {
  if (!value) return null;

  // Split from the right: the email itself contains dots.
  const sigDot = value.lastIndexOf(".");
  const atDot = sigDot > 0 ? value.lastIndexOf(".", sigDot - 1) : -1;
  if (atDot <= 0) return null;
  const email = value.slice(0, atDot);
  const verifiedAtRaw = value.slice(atDot + 1, sigDot);
  const signature = value.slice(sigDot + 1);

  const verifiedAt = Number(verifiedAtRaw);
  const age = Date.now() - verifiedAt;
  // A little future skew is tolerated; anything older than the window is not.
  if (!email || !signature || !Number.isFinite(verifiedAt) || age > OPS_REVERIFY_MS || age < -60_000) {
    return null;
  }

  const expected = await sign(`${email}.${verifiedAtRaw}`);
  return expected && safeEqual(signature, expected) ? email : null;
}

/**
 * Proof that the middleware itself set the founder-email request header.
 * Signed under a different prefix from the cookie, so a cookie signature can
 * never be replayed as a header proof.
 */
export async function signFounderHeader(email: string): Promise<string | null> {
  return sign(`founder-header:${email.trim().toLowerCase()}`);
}

export async function verifyFounderHeader(
  email: string | null,
  proof: string | null
): Promise<boolean> {
  if (!email || !proof) return false;
  const expected = await signFounderHeader(email);
  return Boolean(expected && safeEqual(proof, expected));
}

export { FOUNDER_PROOF_HEADER, OPS_REVERIFY_MS, VERIFIED_COOKIE };
