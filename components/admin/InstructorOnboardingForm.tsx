'use client';

import { useId, useState } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';
type Step = 1 | 2 | 3;

type FileField = 'dbsCertificate' | 'adiCertificate' | 'insuranceCertificate' | 'photoId';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const FILE_FIELDS: { key: FileField; label: string; required: boolean }[] = [
  { key: 'dbsCertificate', label: 'DBS certificate', required: true },
  { key: 'adiCertificate', label: 'ADI certificate', required: true },
  { key: 'insuranceCertificate', label: 'Insurance certificate', required: true },
  { key: 'photoId', label: 'Photo ID', required: false },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-racing-green focus-visible:ring-offset-2 focus-visible:ring-offset-white';

function fieldClass() {
  return `bg-canvas border border-[#E8E8F2] rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-muted ${focusRing}`;
}

export function InstructorOnboardingForm() {
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const adiNumberId = useId();
  const areasId = useId();
  const experienceId = useId();

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [adiNumber, setAdiNumber] = useState('');
  const [transmission, setTransmission] = useState<'manual' | 'automatic' | 'both'>('manual');
  const [areas, setAreas] = useState('');
  const [experience, setExperience] = useState('');

  const [files, setFiles] = useState<Partial<Record<FileField, File>>>({});
  const [fileError, setFileError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const detailsValid = name.trim() && email.trim() && adiNumber.trim();
  const filesValid = FILE_FIELDS.every((f) => !f.required || files[f.key]);

  const onFileChange = (field: FileField, fileList: FileList | null) => {
    const file = fileList?.[0];
    setFileError(null);
    if (!file) {
      setFiles((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Please upload a PDF, JPG, or PNG.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError('Files must be 10MB or smaller.');
      return;
    }
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const onSubmit = async () => {
    if (status === 'submitting') return;
    setStatus('submitting');
    setError(null);
    try {
      const formData = new FormData();
      formData.set('name', name);
      formData.set('email', email);
      formData.set('phone', phone);
      formData.set('adiNumber', adiNumber);
      formData.set('transmission', transmission);
      formData.set('areas', areas);
      formData.set('experience', experience);
      for (const { key } of FILE_FIELDS) {
        const file = files[key];
        if (file) formData.set(key, file);
      }

      const res = await fetch('/api/onboarding', { method: 'POST', body: formData });
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
        <h3 className="text-xl font-extrabold tracking-tight">Application received.</h3>
        <p className="mt-2 text-sm text-ink-secondary">
          We&rsquo;ll review the documents and follow up with {name || 'them'} directly.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E8F2] rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-2 mb-6">
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-racing-green' : 'bg-[#E8E8F2]'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <h2 className="text-lg font-extrabold tracking-tight">Instructor details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={nameId} className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
                Full name <span className="text-deep-rose">*</span>
              </label>
              <input id={nameId} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass()} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={emailId} className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
                Email <span className="text-deep-rose">*</span>
              </label>
              <input
                id={emailId}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={phoneId} className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
                Phone
              </label>
              <input
                id={phoneId}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldClass()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={adiNumberId} className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
                ADI number <span className="text-deep-rose">*</span>
              </label>
              <input
                id={adiNumberId}
                value={adiNumber}
                onChange={(e) => setAdiNumber(e.target.value)}
                placeholder="ADI-1234"
                className={fieldClass()}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Transmission</span>
            <div role="radiogroup" aria-label="Transmission" className="inline-flex rounded-full bg-canvas border border-[#E8E8F2] p-1 self-start">
              {(['manual', 'automatic', 'both'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={transmission === t}
                  onClick={() => setTransmission(t)}
                  className={`px-4 py-2 text-sm font-bold rounded-full capitalize motion-safe:transition-colors ${
                    transmission === t ? 'bg-ink text-white' : 'text-ink-secondary hover:text-ink'
                  } ${focusRing}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={areasId} className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
              Areas covered
            </label>
            <input
              id={areasId}
              value={areas}
              onChange={(e) => setAreas(e.target.value)}
              placeholder="Norwich City, Thorpe St Andrew, Hellesdon"
              className={fieldClass()}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={experienceId} className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
              Years teaching / notes
            </label>
            <textarea
              id={experienceId}
              rows={3}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className={`${fieldClass()} resize-none`}
            />
          </div>

          <button
            type="button"
            disabled={!detailsValid}
            onClick={() => setStep(2)}
            className={`self-start inline-flex items-center justify-center bg-ink text-white rounded-full px-6 py-3.5 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`}
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <h2 className="text-lg font-extrabold tracking-tight">Verification documents</h2>
          <p className="text-sm text-ink-secondary">PDF, JPG, or PNG. Max 10MB each.</p>

          {FILE_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
                {f.label} {f.required && <span className="text-deep-rose">*</span>}
              </label>
              <input
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={(e) => onFileChange(f.key, e.target.files)}
                className={`text-sm text-ink-secondary ${focusRing}`}
              />
              {files[f.key] && (
                <span className="text-xs text-racing-green font-semibold">{files[f.key]!.name}</span>
              )}
            </div>
          ))}

          {fileError && (
            <p role="alert" className="text-sm text-deep-rose font-semibold">
              {fileError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`inline-flex items-center justify-center text-ink-secondary hover:text-ink rounded-full px-6 py-3.5 text-sm font-bold ${focusRing}`}
            >
              Back
            </button>
            <button
              type="button"
              disabled={!filesValid}
              onClick={() => setStep(3)}
              className={`inline-flex items-center justify-center bg-ink text-white rounded-full px-6 py-3.5 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <h2 className="text-lg font-extrabold tracking-tight">Review &amp; submit</h2>
          <dl className="text-sm divide-y divide-[#E8E8F2]">
            {[
              ['Name', name],
              ['Email', email],
              ['Phone', phone || '—'],
              ['ADI number', adiNumber],
              ['Transmission', transmission],
              ['Areas', areas || '—'],
              ['Experience', experience || '—'],
              ...FILE_FIELDS.map((f) => [f.label, files[f.key]?.name || (f.required ? 'Missing' : 'Not provided')]),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-secondary font-semibold">{k}</dt>
                <dd className="text-ink text-right">{v}</dd>
              </div>
            ))}
          </dl>

          {error && (
            <p role="alert" className="text-sm text-deep-rose font-semibold">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`inline-flex items-center justify-center text-ink-secondary hover:text-ink rounded-full px-6 py-3.5 text-sm font-bold ${focusRing}`}
            >
              Back
            </button>
            <button
              type="button"
              disabled={status === 'submitting'}
              onClick={onSubmit}
              className={`inline-flex items-center justify-center bg-ink text-white rounded-full px-6 py-3.5 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`}
            >
              {status === 'submitting' ? 'Submitting…' : 'Submit application'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
