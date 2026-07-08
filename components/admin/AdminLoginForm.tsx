'use client';

import { useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-racing-green focus-visible:ring-offset-2 focus-visible:ring-offset-white';

export function AdminLoginForm() {
  const passwordId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Something went wrong.');
      }
      const next = searchParams.get('next') || '/admin/onboarding';
      router.push(next);
      router.refresh();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="bg-white border border-[#E8E8F2] rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)]"
    >
      <h1 className="text-xl font-extrabold tracking-tight">Admin access</h1>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={passwordId} className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
          Password
        </label>
        <input
          id={passwordId}
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`bg-canvas border border-[#E8E8F2] rounded-xl px-4 py-3 text-sm text-ink ${focusRing}`}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-deep-rose font-semibold">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className={`inline-flex items-center justify-center bg-ink text-white rounded-full px-6 py-3.5 text-sm font-bold touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`}
      >
        {status === 'submitting' ? 'Checking…' : 'Continue'}
      </button>
    </form>
  );
}
