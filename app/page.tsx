import Link from 'next/link';
import { INSTRUCTORS } from '@/lib/instructors';
import { InstructorCard } from '@/components/landing/InstructorCard';
import { BookingFlowPlayer } from '@/components/landing/BookingFlowPlayer';
import { MiniSlotPicker } from '@/components/landing/MiniSlotPicker';
import { DASHBOARD_URL, LOGIN_URL } from '@/lib/env';
import {
  JsonLd,
  ORGANIZATION_JSONLD,
  WEBSITE_JSONLD,
  LOCAL_BUSINESS_JSONLD,
  MOBILE_APP_JSONLD,
  FAQ_JSONLD,
  FAQ_ITEMS,
  BREADCRUMB_JSONLD,
  INSTRUCTOR_LIST_JSONLD,
} from '@/lib/structured-data';

export const metadata = {
  title: 'Book Driving Lessons in Norwich — Verified Instructors, 60-Second Booking',
  description:
    'Book driving lessons in Norwich with DBS-verified, ADI-qualified instructors. Real-time availability for the next 14 days. Pay by card, bank transfer, or cash. iOS app.',
  alternates: {
    canonical: '/',
  },
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-racing-green focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

function Logo({ size = 22 }: { size?: number }) {
  return (
    <span
      className="font-extrabold tracking-tight leading-none"
      style={{ fontSize: size, letterSpacing: '-0.5px' }}
      translate="no"
    >
      <span className="text-racing-green">newdr</span>
      <span className="text-deep-rose">y</span>
      <span className="text-racing-green">ve</span>
    </span>
  );
}

function AppStoreBadge({ className = '' }: { className?: string }) {
  return (
    <a
      href="https://apps.apple.com/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download Newdryve on the App Store"
      className={`inline-flex items-center gap-2.5 bg-ink text-white rounded-xl px-5 py-2.5 leading-none touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:bg-[#1a1a2c] ${focusRing} ${className}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
      <span className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium opacity-75 leading-none">Download on the</span>
        <span className="text-[15px] font-bold leading-none">App&nbsp;Store</span>
      </span>
    </a>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[1px] text-deep-rose mb-3">
      {children}
    </p>
  );
}

const FEATURED_INSTRUCTORS = ['sarah', 'priya', 'tom'];

const PAYMENT_METHODS = [
  {
    title: 'Card',
    sub: 'Visa ending 4242 · £38.00',
    badge: 'Default',
    accent: 'green' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'Bank transfer',
    sub: 'Faster Payments · BACS',
    badge: null,
    accent: 'neutral' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M3 22h18M12 2 3 7v1h18V7l-9-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Cash on arrival',
    sub: 'Pay your instructor in person',
    badge: null,
    accent: 'neutral' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <>
      <JsonLd
        data={[
          ORGANIZATION_JSONLD,
          WEBSITE_JSONLD,
          LOCAL_BUSINESS_JSONLD,
          MOBILE_APP_JSONLD,
          FAQ_JSONLD,
          BREADCRUMB_JSONLD,
          INSTRUCTOR_LIST_JSONLD,
        ]}
      />
      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-ink focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold ${focusRing}`}
      >
        Skip to content
      </a>

      <div className="bg-canvas text-ink min-h-screen">
        {/* Nav */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-canvas/80 border-b border-[#E8E8F2]">
          <nav aria-label="Primary" className="max-w-6xl mx-auto h-16 flex items-center justify-between px-5">
            <Link
              href="/"
              aria-label="Newdryve home"
              className={`flex items-center rounded-md p-1 -m-1 touch-manipulation ${focusRing}`}
            >
              <Logo />
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <a
                href="#features"
                className={`hidden sm:inline-block text-sm font-semibold text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md px-2 py-1 ${focusRing}`}
              >
                Features
              </a>
              <a
                href="#instructors"
                className={`hidden sm:inline-block text-sm font-semibold text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md px-2 py-1 ${focusRing}`}
              >
                Instructors
              </a>
              <a
                href={LOGIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm font-semibold text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md px-2 py-1 ${focusRing}`}
              >
                Log&nbsp;in
              </a>
              <a
                href={DASHBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 bg-ink text-white rounded-full px-4 py-2 text-sm font-bold tracking-tight touch-manipulation motion-safe:transition-colors hover:bg-[#1a1a2c] ${focusRing}`}
              >
                Open Dashboard
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M3 9L9 3M9 3H4.5M9 3V7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </nav>
        </header>

        <main id="main">
          {/* HERO */}
          <section className="hero-bg relative overflow-hidden">
            <div className="absolute inset-0 dot-pattern opacity-50 pointer-events-none" aria-hidden="true" />
            <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
              {/* Left: text + CTAs */}
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-blush-surface border border-blush-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1px] text-deep-rose">
                  <span className="size-1.5 rounded-full bg-deep-rose" aria-hidden="true" />
                  Norwich · iOS · UK
                </span>

                <h1 className="mt-5 text-[clamp(36px,6.5vw,64px)] font-extrabold leading-[1.05] tracking-[-1.5px] text-balance">
                  Book your next driving lesson with{' '}
                  <span className="gradient-text">Sarah</span> in 60&nbsp;seconds.
                </h1>

                <p className="mt-5 text-lg text-ink-secondary leading-relaxed max-w-xl text-pretty">
                  Find a verified instructor near you, see real availability for the next 14&nbsp;days, and pay your way — card, bank transfer, or cash.{' '}
                  <span className="text-ink font-semibold">No phone tag.</span>
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <AppStoreBadge />
                  <a
                    href={DASHBOARD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 bg-white text-ink border border-[#E8E8F2] rounded-full px-5 py-3 text-sm font-bold touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:border-ink ${focusRing}`}
                  >
                    Open Dashboard
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M3 9L9 3M9 3H4.5M9 3V7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>

                <div className="mt-6 flex items-center gap-4 tabular-nums text-sm text-ink-secondary">
                  <span className="flex items-center gap-1.5">
                    <span className="text-ink font-bold">★&nbsp;4.9</span>
                    <span>from 127 reviews</span>
                  </span>
                  <span className="text-ink-muted">·</span>
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="6" stroke="#00875A" strokeWidth="1.5" />
                      <path d="M4 7l2 2 4-4" stroke="#00875A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>All instructors DBS verified</span>
                  </span>
                </div>
              </div>

              {/* Right: animated phone */}
              <div className="relative flex justify-center md:justify-end">
                <div className="relative">
                  <BookingFlowPlayer />
                  {/* floating booked-in chip */}
                  <div
                    aria-hidden="true"
                    className="hidden md:flex absolute -left-10 top-20 bg-white border border-[#E8E8F2] rounded-2xl px-4 py-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.18)] gap-3 items-center"
                  >
                    <span className="size-9 rounded-full bg-racing-green text-white flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M4 9l3 3 7-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Booked in</div>
                      <div className="text-base font-extrabold text-ink tabular-nums">47 seconds</div>
                    </div>
                  </div>
                  <div
                    aria-hidden="true"
                    className="hidden md:flex absolute -right-6 bottom-32 bg-white border border-[#E8E8F2] rounded-2xl px-3 py-2.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.18)] gap-2 items-center"
                  >
                    <span className="size-8 rounded-full bg-deep-rose text-white flex items-center justify-center text-[11px] font-extrabold">
                      PS
                    </span>
                    <div>
                      <div className="text-xs font-bold text-ink leading-tight">Priya · ★ 5.0</div>
                      <div className="text-[10px] text-ink-secondary">3 slots today</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* INSTRUCTOR SHOWCASE */}
          <section id="instructors" className="bg-white border-y border-[#E8E8F2]">
            <div className="max-w-6xl mx-auto px-5 py-20">
              <div className="max-w-2xl">
                <SectionEyebrow>Norwich · 4 verified instructors</SectionEyebrow>
                <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-[-1px] leading-[1.1] text-balance">
                  Real instructors. <span className="gradient-text">Real availability.</span>
                </h2>
                <p className="mt-4 text-base text-ink-secondary text-pretty">
                  Every instructor is DBS checked and independently reviewed. Browse, compare, and book — no calls, no waiting list.
                </p>
              </div>

              <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {FEATURED_INSTRUCTORS.map((id, i) => {
                  const ins = INSTRUCTORS.find((x) => x.id === id)!;
                  return (
                    <div
                      key={id}
                      className={`motion-safe:transition-transform ${i === 1 ? 'lg:translate-y-6' : ''}`}
                    >
                      <InstructorCard instructor={ins} />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section id="features" className="bg-canvas">
            <div className="max-w-6xl mx-auto px-5 py-20">
              <div className="max-w-2xl mb-12">
                <SectionEyebrow>Why Newdryve</SectionEyebrow>
                <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-[-1px] leading-[1.1] text-balance">
                  Built for learners, not call centres.
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {/* Feature 1: Real-time availability */}
                <article className="bg-white rounded-2xl border border-[#E8E8F2] p-6 flex flex-col gap-5 motion-safe:transition-shadow motion-safe:hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]">
                  <div className="rounded-xl bg-canvas p-4 -m-2 mb-0">
                    <MiniSlotPicker selectedIndex={3} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-[-0.3px] text-balance">
                      Real-time availability, not phone tag.
                    </h3>
                    <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
                      See the next 14 days of real openings. Tap a slot, you&rsquo;re in.
                    </p>
                  </div>
                </article>

                {/* Feature 2: Payment options */}
                <article className="bg-white rounded-2xl border border-[#E8E8F2] p-6 flex flex-col gap-5 motion-safe:transition-shadow motion-safe:hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]">
                  <div className="rounded-xl bg-canvas p-4 flex flex-col gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <div
                        key={m.title}
                        className={`flex items-center gap-3 rounded-xl bg-white border px-3 py-2.5 ${
                          m.accent === 'green' ? 'border-racing-green/30 ring-1 ring-racing-green/10' : 'border-[#E8E8F2]'
                        }`}
                      >
                        <span className={`flex items-center justify-center size-9 rounded-lg ${
                          m.accent === 'green' ? 'bg-racing-green/10 text-racing-green' : 'bg-canvas text-ink-secondary'
                        }`}>
                          {m.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-ink leading-tight">{m.title}</div>
                          <div className="text-[11px] text-ink-secondary tabular-nums truncate">{m.sub}</div>
                        </div>
                        {m.accent === 'green' && (
                          <span className="flex items-center justify-center size-5 rounded-full bg-racing-green" aria-hidden="true">
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                              <path d="M3 5.5l1.5 1.5 3.5-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-[-0.3px] text-balance">
                      Pay your way — card, bank transfer, or cash.
                    </h3>
                    <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
                      No surprise fees. No hidden charges. Pick what works for you.
                    </p>
                  </div>
                </article>

                {/* Feature 3: Track progress */}
                <article className="bg-white rounded-2xl border border-[#E8E8F2] p-6 flex flex-col gap-5 motion-safe:transition-shadow motion-safe:hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]">
                  <div className="rounded-xl bg-canvas p-4">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Hours toward test</div>
                        <div className="mt-1 text-2xl font-extrabold tracking-[-0.5px] tabular-nums">
                          12<span className="text-base text-ink-secondary font-medium">&nbsp;/&nbsp;40&nbsp;hrs</span>
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                        style={{ background: 'rgba(45,106,79,0.10)', color: '#2D6A4F' }}
                      >
                        On track
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white border border-[#E8E8F2] overflow-hidden">
                      <div className="h-full gradient-bg rounded-full" style={{ width: '30%' }} />
                    </div>
                    <div className="mt-4 flex items-end gap-1.5 h-12">
                      {[3, 5, 4, 6, 8, 7, 9].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm"
                          style={{ height: `${h * 10}%`, background: i === 6 ? '#2D6A4F' : 'rgba(45,106,79,0.20)' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-[-0.3px] text-balance">
                      Track every lesson, every hour.
                    </h3>
                    <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
                      Your full lesson history, hours logged, and progress at a glance.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </section>

          {/* FOR INSTRUCTORS */}
          <section className="bg-ink text-white">
            <div className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[1px] text-deep-rose mb-3">For instructors</p>
                <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-[-1px] leading-[1.1] text-balance">
                  Run your driving school. <br className="hidden md:block" />
                  <span className="gradient-text">We handle the rest.</span>
                </h2>
                <p className="mt-4 text-base text-white/60 leading-relaxed max-w-md text-pretty">
                  A professional, branded booking experience — without the cost or complexity of building one yourself.
                </p>
                <a
                  href={DASHBOARD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-7 inline-flex items-center gap-1.5 bg-racing-green hover:bg-racing-green-dark text-white rounded-full px-5 py-3 text-sm font-bold touch-manipulation motion-safe:transition-colors ${focusRing}`}
                >
                  Open Instructor Dashboard
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M3 9L9 3M9 3H4.5M9 3V7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>

              {/* Mini dashboard mockup */}
              <div className="bg-[#13131F] border border-white/10 rounded-2xl p-5 shadow-[0_30px_80px_-20px_rgba(45,106,79,0.4)]">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">Good morning, Sarah</div>
                    <div className="text-lg font-extrabold tracking-[-0.3px]">Today&rsquo;s overview</div>
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1"
                    style={{ background: 'rgba(0,194,122,0.18)', color: '#4ADE80' }}
                  >
                    Live
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'Lessons today', value: '4', sub: '£152 booked' },
                    { label: 'This week', value: '21', sub: '£798 earned' },
                    { label: 'Rating', value: '4.9', sub: '127 reviews' },
                    { label: 'Hours given', value: '340', sub: 'all-time' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">{s.label}</div>
                      <div className="mt-1 text-2xl font-extrabold tracking-[-0.5px] tabular-nums">{s.value}</div>
                      <div className="text-[11px] text-white/50 tabular-nums">{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* mini chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-baseline justify-between mb-3">
                    <div className="text-xs font-bold text-white/70">Earnings · last 7 days</div>
                    <div className="text-xs font-bold tabular-nums text-racing-green">+18%</div>
                  </div>
                  <div className="flex items-end gap-1.5 h-16">
                    {[6, 4, 7, 5, 8, 9, 7].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md"
                        style={{
                          height: `${h * 10}%`,
                          background: i === 6 ? '#E8527A' : 'rgba(45,106,79,0.5)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {['Set your availability', 'Earnings at a glance', 'Branded for you', 'Zero admin overhead'].map((p) => (
                    <div key={p} className="flex items-center gap-2 text-xs text-white/70">
                      <span className="size-4 rounded-full bg-racing-green/30 border border-racing-green flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                          <path d="M1.5 4l1.5 1.5 3.5-3.5" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="bg-white border-t border-[#E8E8F2]">
            <div className="max-w-3xl mx-auto px-5 py-20">
              <div className="text-center mb-10">
                <SectionEyebrow>Frequently asked</SectionEyebrow>
                <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-[-1px] leading-[1.1] text-balance">
                  Everything you need to know.
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {FAQ_ITEMS.map((item) => (
                  <details
                    key={item.q}
                    className="group bg-canvas border border-[#E8E8F2] rounded-2xl px-5 py-4 motion-safe:transition-colors hover:bg-blush-surface"
                  >
                    <summary
                      className={`flex items-center justify-between gap-4 cursor-pointer font-bold text-ink list-none touch-manipulation ${focusRing} rounded-md`}
                    >
                      <span className="text-pretty">{item.q}</span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                        className="flex-shrink-0 text-ink-secondary motion-safe:transition-transform group-open:rotate-180"
                      >
                        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <p className="mt-3 text-sm text-ink-secondary leading-relaxed text-pretty">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="bg-canvas">
            <div className="max-w-3xl mx-auto px-5 py-20 text-center">
              <div className="bg-white border border-[#E8E8F2] rounded-3xl px-8 py-14 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)]">
                <h2 className="text-[clamp(28px,4.5vw,40px)] font-extrabold tracking-[-1px] leading-[1.1] text-balance">
                  Ready to get on the road?
                </h2>
                <p className="mt-4 text-base text-ink-secondary text-pretty">
                  Download Newdryve and book your first lesson today.
                </p>
                <div className="mt-7 flex flex-col items-center gap-3">
                  <AppStoreBadge />
                  <p className="text-xs text-ink-muted">iOS · UK · Free download</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-[#E8E8F2]">
          <div className="max-w-6xl mx-auto px-5 py-8 flex flex-wrap items-center justify-between gap-4">
            <Link href="/" aria-label="Newdryve home" className={`rounded-md p-1 -m-1 ${focusRing}`}>
              <Logo size={18} />
            </Link>
            <p className="text-xs text-ink-secondary">© 2026 Newdryve. All rights reserved.</p>
            <div className="flex items-center gap-5 text-xs font-semibold">
              <a
                href={LOGIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md ${focusRing}`}
              >
                Log&nbsp;in
              </a>
              <a
                href={DASHBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-racing-green hover:text-racing-green-dark motion-safe:transition-colors rounded-md inline-flex items-center gap-1 ${focusRing}`}
              >
                Dashboard
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M3 9L9 3M9 3H4.5M9 3V7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
