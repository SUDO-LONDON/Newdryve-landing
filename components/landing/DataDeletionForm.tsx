'use client';

import { useId, useState } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-racing-green focus-visible:ring-offset-2 focus-visible:ring-offset-white';

type FieldProps = {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel';
  autoComplete: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

function Field({ id, label, type, autoComplete, value, placeholder, onChange }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
        {label} <span aria-hidden="true" className="text-deep-rose">*</span>
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        autoComplete={autoComplete}
        inputMode={type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'text'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`min-h-12 rounded-xl border border-[#E8E8F2] bg-canvas px-4 py-3 text-base text-ink placeholder:text-ink-muted sm:text-sm ${focusRing}`}
      />
    </div>
  );
}

export function DataDeletionForm() {
  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const phoneId = useId();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    setError(null);

    try {
      const response = await fetch('/api/data-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'We could not submit your request. Please try again.');
      }

      setStatus('success');
    } catch (submissionError) {
      setStatus('error');
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'We could not submit your request. Please try again.',
      );
    }
  };

  if (status === 'success') {
    return (
      <div
        role="status"
        className="rounded-2xl border border-[#E8E8F2] bg-white p-7 text-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)] sm:p-9"
      >
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-racing-green/10 text-racing-green">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M5 11l4 4 8-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Request received.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-secondary">
          We&rsquo;ve sent your request to the Newdryve team. We may contact you using the details provided if we need to verify your identity before deleting your data.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-[#E8E8F2] bg-white p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)] sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={firstNameId}
          label="First name"
          type="text"
          autoComplete="given-name"
          value={firstName}
          onChange={setFirstName}
          placeholder="First name"
        />
        <Field
          id={lastNameId}
          label="Last name"
          type="text"
          autoComplete="family-name"
          value={lastName}
          onChange={setLastName}
          placeholder="Last name"
        />
      </div>

      <Field
        id={emailId}
        label="Email address"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
      />

      <Field
        id={phoneId}
        label="Phone number"
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={setPhone}
        placeholder="e.g. 07700 900000"
      />

      {error && (
        <p role="alert" className="text-sm font-semibold text-deep-rose">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_28px_-12px_rgba(10,10,20,0.55)] touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:bg-[#1a1a2c] disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none ${focusRing}`}
      >
        {status === 'submitting' ? 'Sending request…' : 'Request data deletion'}
        {status !== 'submitting' && (
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 9L9 3M9 3H4.5M9 3V7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <p className="text-xs leading-relaxed text-ink-muted">
        We&rsquo;ll use these details only to locate your account, verify your identity and process this request.
      </p>
    </form>
  );
}
