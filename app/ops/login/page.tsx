"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

function opsAuthCallbackOrigin(): string {
  if (PUBLIC_SITE_URL) return PUBLIC_SITE_URL;

  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (localHosts.has(window.location.hostname)) {
    return window.location.origin;
  }

  return "https://newdryve.com";
}

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") || "/ops";
  const timedOut = params.get("timeout") === "1";
  const linkError = params.get("error") === "1";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const emailRedirectTo = `${opsAuthCallbackOrigin()}/ops/auth/confirm?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 hero-bg">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white/80 backdrop-blur p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-racing-green">
            Newdryve
          </p>
          <h1 className="font-display text-2xl text-ink mt-1">Ops Portal</h1>
          <p className="text-sm text-ink-secondary mt-2">
            Founder access only. Enter your email and we&apos;ll send a one-time sign-in link.
          </p>
        </div>

        {timedOut && (
          <p className="mb-4 rounded-lg bg-blush-surface border border-blush-border px-3 py-2 text-sm text-ink-secondary">
            You were signed out after a period of inactivity. Please sign in again.
          </p>
        )}
        {linkError && (
          <p className="mb-4 rounded-lg bg-blush-surface border border-blush-border px-3 py-2 text-sm text-deep-rose">
            That sign-in link was invalid or expired. Request a new one below.
          </p>
        )}

        {status === "sent" ? (
          <div className="rounded-lg bg-blush-surface border border-blush-border px-4 py-6 text-center">
            <p className="text-ink font-medium">Check your inbox</p>
            <p className="text-sm text-ink-secondary mt-1">
              We sent a sign-in link to <span className="text-ink">{email}</span>. If this
              address is on the founder allowlist, the link will grant access.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@newdryve.com"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {status === "error" && message && (
              <p className="text-sm text-deep-rose">{message}</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-lg gradient-bg px-4 py-2.5 text-white font-medium disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-xs text-ink-muted">
          This is a private internal system. Unauthorised access is prohibited.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
