import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of Newdryve.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="bg-canvas text-ink min-h-screen">
      <main className="max-w-3xl mx-auto px-5 py-16 md:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-secondary hover:text-ink motion-safe:transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M9.5 6h-7M6 2.5 2.5 6 6 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to home
        </Link>

        <h1 className="font-display mt-6 text-[clamp(32px,5vw,48px)] font-semibold tracking-[-1px] leading-[1.05]">
          Terms of Service
        </h1>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blush-surface border border-blush-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1px] text-deep-rose">
          Placeholder · content coming soon
        </div>

        <div className="mt-8 space-y-4 text-base text-ink-secondary leading-relaxed">
          <p>
            This is a placeholder Terms of Service for Newdryve. The full terms are being written and will be published
            here before launch.
          </p>
          <p>
            Newdryve is currently in early access. Joining the waitlist does not guarantee a place in the founding cohort
            and is not a contract for driving lessons. Pricing and features described on this site are subject to change
            before launch.
          </p>
          <p>
            Questions in the meantime? Email{' '}
            <a href="mailto:hello@newdryve.com" className="font-semibold text-ink underline underline-offset-2">
              hello@newdryve.com
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
