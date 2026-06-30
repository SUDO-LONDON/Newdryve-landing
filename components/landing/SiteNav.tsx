'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-racing-green focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

function LogoMark({ size = 26 }: { size?: number }) {
  // Brand "n" symbol mark from assets/logo/newdryve-logo.svg — gradient glyph
  // with a dashed-road motif clipped to the letter.
  const nPath =
    'M29.596 64 L20.356 64 L20.356 30.736 L28.474 30.736 L29.134 36.148 Q30.652 33.376 33.457 31.66 Q36.262 29.944 40.222 29.944 Q44.314 29.944 47.152 31.693 Q49.99 33.442 51.475 36.742 Q52.96 40.042 52.96 44.86 L52.96 64 L43.786 64 L43.786 45.718 Q43.786 41.89 42.169 39.811 Q40.552 37.732 37.054 37.732 Q34.942 37.732 33.226 38.755 Q31.51 39.778 30.553 41.659 Q29.596 43.54 29.596 46.246 L29.596 64 Z';
  return (
    <svg
      width={size}
      height={size}
      viewBox="18 29 37 37"
      fill="none"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient id="nd-grad" gradientUnits="userSpaceOnUse" x1="20" y1="40" x2="53" y2="40">
          <stop offset="0%" stopColor="#2D6A4F" />
          <stop offset="100%" stopColor="#E8527A" />
        </linearGradient>
        <clipPath id="nd-n-clip">
          <path d={nPath} />
        </clipPath>
      </defs>
      <path d={nPath} fill="url(#nd-grad)" />
      <g clipPath="url(#nd-n-clip)" opacity="0.75">
        <line x1="25" y1="33" x2="25" y2="62" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" />
        <path d="M 25 43 C 30 35 48 27 48 45" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" fill="none" />
        <line x1="48" y1="45" x2="48" y2="62" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" />
      </g>
    </svg>
  );
}

function Logo({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2" translate="no">
      <LogoMark size={size + 6} />
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
