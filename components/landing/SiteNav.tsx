'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-racing-green focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

function Logo({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2" translate="no">
      <svg width={size + 4} height={size + 4} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#2D6A4F" />
        <path
          d="M9 22V10l6.5 8.5V10M20 10v12"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="22" r="1.6" fill="#E8527A" />
      </svg>
      <span
        className="font-extrabold tracking-tight leading-none"
        style={{ fontSize: size, letterSpacing: '-0.5px' }}
      >
        <span className="text-racing-green">newdr</span>
        <span className="text-deep-rose">y</span>
        <span className="text-racing-green">ve</span>
      </span>
    </span>
  );
}

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#instructors', label: 'For instructors' },
  { href: '#learners', label: 'For learners' },
  { href: '#faq', label: 'FAQ' },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 motion-safe:transition-all motion-safe:duration-300 ${
        scrolled
          ? 'bg-canvas/85 backdrop-blur-md border-b border-[#E8E8F2] shadow-[0_4px_24px_-12px_rgba(0,0,0,0.18)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav
        aria-label="Primary"
        className="max-w-6xl mx-auto h-16 flex items-center justify-between px-5"
      >
        <Link
          href="/"
          aria-label="Newdryve home"
          className={`flex items-center rounded-md p-1 -m-1 touch-manipulation ${focusRing}`}
        >
          <Logo />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm font-semibold text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md px-3 py-2 ${focusRing}`}
            >
              {l.label}
            </a>
          ))}
        </div>

        <a
          href="#signup"
          className={`inline-flex items-center gap-1.5 bg-deep-rose text-white rounded-full px-3.5 sm:px-5 py-2.5 text-sm font-bold tracking-tight touch-manipulation motion-safe:transition-all motion-safe:hover:-translate-y-0.5 hover:bg-[#d8406b] shadow-[0_8px_20px_-8px_rgba(232,82,122,0.6)] ${focusRing}`}
        >
          <span className="sm:hidden">Apply</span>
          <span className="hidden sm:inline">Apply for early access</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M3 9L9 3M9 3H4.5M9 3V7.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </nav>
    </header>
  );
}
