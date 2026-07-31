import type { Metadata } from 'next';
import Link from 'next/link';
import { DataDeletionForm } from '@/components/landing/DataDeletionForm';

export const metadata: Metadata = {
  title: 'Request data deletion',
  description: 'Ask Newdryve to delete your account and associated personal data.',
  alternates: { canonical: '/datadeletion' },
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-racing-green focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

function Logo() {
  return (
    <span className="font-extrabold leading-none tracking-tight" translate="no">
      <span className="text-racing-green">newdr</span>
      <span className="text-deep-rose">y</span>
      <span className="text-racing-green">ve</span>
    </span>
  );
}

export default function DataDeletionPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-ink">
      <div className="dot-pattern pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-deep-rose/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -left-36 size-[32rem] rounded-full bg-racing-green/10 blur-3xl"
        aria-hidden="true"
      />

      <header className="relative border-b border-[#E8E8F2] bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="Newdryve home" className={`rounded-md p-1 text-xl ${focusRing}`}>
            <Logo />
          </Link>
          <Link
            href="/privacy"
            className={`rounded-md text-sm font-semibold text-ink-secondary motion-safe:transition-colors hover:text-ink ${focusRing}`}
          >
            Privacy Policy
          </Link>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[0.9fr_1.1fr] md:items-start md:gap-16 md:py-20">
        <div className="md:sticky md:top-24">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 rounded-md text-sm font-bold text-ink-secondary motion-safe:transition-colors hover:text-ink ${focusRing}`}
          >
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M9.5 6h-7M6 2.5 2.5 6 6 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to home
          </Link>

          <p className="mt-8 text-[11px] font-bold uppercase tracking-[1px] text-deep-rose">Your privacy</p>
          <h1 className="font-display mt-3 text-[clamp(38px,6vw,58px)] font-semibold leading-[1.02] tracking-[-1.2px] text-balance">
            Request data deletion.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-secondary md:text-lg">
            Submit the details linked to your Newdryve account and our team will review your request. We may need to verify your identity before taking action.
          </p>

          <div className="mt-8 rounded-2xl border border-blush-border bg-blush-surface p-5">
            <h2 className="text-sm font-extrabold text-ink">What happens next?</h2>
            <ol className="mt-4 space-y-4 text-sm leading-relaxed text-ink-secondary">
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-racing-green text-xs font-bold text-white">1</span>
                <span>We match the details you provide with your Newdryve account.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-deep-rose text-xs font-bold text-white">2</span>
                <span>We contact you if we need more information to verify your identity.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">3</span>
                <span>We delete or anonymise eligible data and confirm when the request is complete.</span>
              </li>
            </ol>
          </div>
        </div>

        <section aria-labelledby="deletion-form-heading">
          <div className="mb-5">
            <h2 id="deletion-form-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Your account details
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              All fields are required. Use the email address and phone number associated with your account.
            </p>
          </div>
          <DataDeletionForm />
          <p className="mt-5 text-xs leading-relaxed text-ink-muted">
            Some records may need to be retained where required by law or for fraud prevention, disputes, tax or accounting purposes. See our{' '}
            <Link href="/privacy" className="font-semibold text-ink underline underline-offset-2">Privacy Policy</Link> for details.
          </p>
        </section>
      </main>
    </div>
  );
}
