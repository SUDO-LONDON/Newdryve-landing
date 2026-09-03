"use client";

import { useMemo, useState } from "react";
import { createOrganisationSupabaseBrowserClient } from "@/lib/organisations/supabase-client";

export default function OrganisationLoginClient({ next }: { next: string }) {
  const supabase = useMemo(() => createOrganisationSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message || "Could not sign in.");
      setBusy(false);
      return;
    }

    window.location.assign(next);
  }

  return (
    <main className="min-h-screen bg-canvas px-5 py-10 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-racing-green">
            Newdryve organisations
          </p>
          <h1 className="mt-3 font-display text-3xl text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Use the admin email and password Newdryve gave your organisation.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-ink">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-3 text-ink outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-3 text-ink outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            {error ? (
              <p className="rounded-xl border border-blush-border bg-blush-surface p-3 text-sm text-deep-rose">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-racing-green px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-racing-green-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-xs text-ink-muted">
            This portal is for authorised organisation admins only.
          </p>
        </div>
      </div>
    </main>
  );
}
