const VERIFIED_COOKIE = "ops_verified";

const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function secret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "ops-dev-session-secret"
  );
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64Url(new Uint8Array(signature));
}

export async function createVerifiedFounderCookie(email: string): Promise<string> {
  const payload = `${email.trim().toLowerCase()}.${Date.now()}`;
  return `${payload}.${await sign(payload)}`;
}

export async function readVerifiedFounderCookie(
  value: string | undefined,
  maxAgeMs: number
): Promise<string | null> {
  if (!value) return null;

  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [email, issuedAtRaw, signature] = parts;
  const issuedAt = Number(issuedAtRaw);
  if (!email || !Number.isFinite(issuedAt) || Date.now() - issuedAt > maxAgeMs) return null;

  const expected = await sign(`${email}.${issuedAtRaw}`);
  return signature === expected ? email : null;
}

export { VERIFIED_COOKIE };
