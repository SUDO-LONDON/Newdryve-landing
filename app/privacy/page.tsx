import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Newdryve handles your personal data.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blush-surface border border-blush-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1px] text-deep-rose">
          Placeholder · content coming soon
        </div>

        <div className="mt-8 space-y-4 text-base text-ink-secondary leading-relaxed">
          <p>
            This is a placeholder Privacy Policy for Newdryve. The full policy is being written and will be published
            here before launch.
          </p>
          <p>
            In short: when you join our early-access waitlist we collect the details you give us (such as your email,
            name, area and any notes) solely to contact you about Newdryve and to build our founding cohort in Norwich.
            We do not sell your data.
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
