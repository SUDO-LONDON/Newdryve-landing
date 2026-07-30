"use client";

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const productUrl = process.env.NEXT_PUBLIC_PRODUCT_SUPABASE_URL;
const productPublishableKey = process.env.NEXT_PUBLIC_PRODUCT_SUPABASE_ANON_KEY;

type FormState = "ready" | "submitting" | "complete" | "error";

function NewdryveWordmark() {
  return (
    <span className="text-xl font-extrabold leading-none" translate="no">
      <span className="text-racing-green">newdr</span>
      <span className="text-deep-rose">y</span>
      <span className="text-racing-green">ve</span>
    </span>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [state, setState] = useState<FormState>("ready");
  const [message, setMessage] = useState("");

  const tokenHash = searchParams.get("token_hash");
  const recoveryType = searchParams.get("type");
  const supabase = useMemo(() => {
    if (!productUrl || !productPublishableKey) {
      return null;
    }

    return createClient(productUrl, productPublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        // Supports Supabase's default recovery redirect, which returns the
        // recovery session in the URL fragment after email verification.
        detectSessionInUrl: true,
      },
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setState("error");
      setMessage("Password reset is temporarily unavailable. Please try again shortly.");
      return;
    }

    if (password.length < 8) {
      setState("error");
      setMessage("Choose a password with at least 8 characters.");
      return;
    }

    if (password !== confirmation) {
      setState("error");
      setMessage("The passwords do not match.");
      return;
    }

    setState("submitting");
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      if (!tokenHash || recoveryType !== "recovery") {
        setState("error");
        setMessage("This reset link has expired or has already been used. Request a new one from the Newdryve app.");
        return;
      }

      const { error: verificationError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });

      if (verificationError) {
        setState("error");
        setMessage("This reset link has expired or has already been used. Request a new one from the Newdryve app.");
        return;
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    await supabase.auth.signOut();

    if (updateError) {
      setState("error");
      setMessage("We could not update your password. Please try again or request a new reset link.");
      return;
    }

    setState("complete");
    setMessage("Your password has been updated. Return to the Newdryve app and sign in.");
    setPassword("");
    setConfirmation("");
  }

  return (
    <main className="min-h-screen bg-canvas px-5 py-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center sm:min-h-[calc(100vh-6rem)]">
        <Link href="/" aria-label="Newdryve home" className="mb-10 inline-flex self-start rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-racing-green focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">
          <NewdryveWordmark />
        </Link>

        <section className="border border-border bg-white p-6 shadow-[0_20px_50px_-30px_rgba(10,10,20,0.22)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[1px] text-deep-rose">Account security</p>
          <h1 className="font-display mt-3 text-3xl font-semibold leading-tight text-ink">Set a new password</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
            Choose a new password for your Newdryve account. You will then sign in again in the app.
          </p>

          {state === "complete" ? (
            <div className="mt-7 border border-racing-green/30 bg-racing-green/10 px-4 py-3 text-sm leading-relaxed text-racing-green" role="status">
              {message}
            </div>
          ) : (
            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold text-ink" htmlFor="password">New password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 block h-12 w-full border border-border bg-white px-3 text-base text-ink outline-none transition focus:border-racing-green focus:ring-2 focus:ring-racing-green/20"
                />
                <p className="mt-2 text-xs text-ink-muted">Use at least 8 characters.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-ink" htmlFor="confirmation">Confirm new password</label>
                <input
                  id="confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="mt-2 block h-12 w-full border border-border bg-white px-3 text-base text-ink outline-none transition focus:border-racing-green focus:ring-2 focus:ring-racing-green/20"
                />
              </div>

              {state === "error" && (
                <p className="border border-deep-rose/30 bg-deep-rose/10 px-4 py-3 text-sm leading-relaxed text-[#a62f50]" role="alert">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={state === "submitting"}
                className="inline-flex h-12 w-full items-center justify-center bg-racing-green px-5 text-sm font-bold text-white transition hover:bg-racing-green-dark disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-racing-green focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {state === "submitting" ? "Updating password..." : "Update password"}
              </button>
            </form>
          )}

          <p className="mt-7 border-t border-border pt-5 text-sm leading-relaxed text-ink-secondary">
            Need help? Contact <a className="font-semibold text-racing-green underline underline-offset-2" href="mailto:support@newdryve.com">support@newdryve.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-canvas px-5 py-8 sm:py-12">
          <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center sm:min-h-[calc(100vh-6rem)]">
            <div className="border border-border bg-white p-6 text-sm text-ink-secondary shadow-[0_20px_50px_-30px_rgba(10,10,20,0.22)] sm:p-8">
              Loading password reset...
            </div>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
