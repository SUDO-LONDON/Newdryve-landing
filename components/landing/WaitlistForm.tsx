'use client';

import { useId, useState } from 'react';

type Role = 'student' | 'instructor';
type Status = 'idle' | 'submitting' | 'success' | 'error';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-racing-green focus-visible:ring-offset-2 focus-visible:ring-offset-white';

export function WaitlistForm({ defaultRole = 'student' }: { defaultRole?: Role }) {
  const emailId = useId();
  const postcodeId = useId();
  const nameId = useId();
  const notesId = useId();

  const [role, setRole] = useState<Role>(defaultRole);
  const [email, setEmail] = useState('');
  const [postcode, setPostcode] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, postcode, name, notes }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-white border border-[#E8E8F2] rounded-2xl p-8 text-center">
        <div className="mx-auto size-12 rounded-full bg-racing-green/10 text-racing-green flex items-center justify-center mb-4">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M5 11l4 4 8-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-xl font-extrabold tracking-tight">You&rsquo;re on the list.</h3>
        <p className="mt-2 text-sm text-ink-secondary">
          We&rsquo;ll be in touch from <span className="font-semibold text-ink">hello@newdryve.com</span> as the early-access cohort opens up.
        </p>
      </div>
    );
  }

  const isInstructor = role === 'instructor';

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="bg-white border border-[#E8E8F2] rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)]"
    >
      {/* role toggle */}
      <div
        role="radiogroup"
        aria-label="I am a"
        className="inline-flex rounded-full bg-canvas border border-[#E8E8F2] p-1 self-start"
      >
        {(['student', 'instructor'] as const).map((r) => {
          const active = role === r;
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRole(r)}
              className={`px-4 py-2 text-sm font-bold rounded-full motion-safe:transition-colors ${
                active ? 'bg-ink text-white' : 'text-ink-secondary hover:text-ink'
              } ${focusRing}`}
            >
              {r === 'student' ? 'I want lessons' : 'I’m an instructor'}
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
            Email <span aria-hidden="true" className="text-deep-rose">*</span>
          </label>
          <input
            id={emailId}
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`bg-canvas border border-[#E8E8F2] rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-muted ${focusRing}`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={nameId} className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
            Name <span className="text-ink-muted font-medium normal-case tracking-normal">(optional)</span>
          </label>
          <input
            id={nameId}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First name"
            className={`bg-canvas border border-[#E8E8F2] rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-muted ${focusRing}`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={postcodeId} className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
          {isInstructor ? 'Where you teach' : 'Postcode or area'} <span className="text-ink-muted font-medium normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id={postcodeId}
          type="text"
          autoComplete="postal-code"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder={isInstructor ? 'e.g. Norwich, Sprowston' : 'e.g. NR1 or Thorpe St Andrew'}
          className={`bg-canvas border border-[#E8E8F2] rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-muted ${focusRing}`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={notesId} className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
          {isInstructor ? 'ADI number or experience' : 'Anything we should know'}{' '}
          <span className="text-ink-muted font-medium normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          id={notesId}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            isInstructor
              ? 'ADI-1234, transmission, years teaching, anything else…'
              : 'Beginner, automatic only, test booked for July…'
          }
          className={`bg-canvas border border-[#E8E8F2] rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-muted resize-none ${focusRing}`}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-deep-rose font-semibold">
          {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className={`inline-flex items-center justify-center gap-1.5 bg-ink text-white rounded-full px-6 py-3.5 text-sm font-bold touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:bg-[#1a1a2c] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${focusRing}`}
        >
          {status === 'submitting' ? 'Sending…' : isInstructor ? 'Apply as a founding instructor' : 'Join the Norwich waitlist'}
          {status !== 'submitting' && (
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M3 9L9 3M9 3H4.5M9 3V7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <p className="text-xs text-ink-muted">
          No spam. We&rsquo;ll only email you about Newdryve.
        </p>
      </div>
    </form>
  );
}
