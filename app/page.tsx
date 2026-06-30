import Link from 'next/link';
import { BookingFlowPlayer } from '@/components/landing/BookingFlowPlayer';
import { MiniSlotPicker } from '@/components/landing/MiniSlotPicker';
import { WaitlistForm } from '@/components/landing/WaitlistForm';
import { SiteNav } from '@/components/landing/SiteNav';
import { Reveal } from '@/components/landing/Reveal';
import {
  JsonLd,
  ORGANIZATION_JSONLD,
  WEBSITE_JSONLD,
  FAQ_JSONLD,
  FAQ_ITEMS,
  BREADCRUMB_JSONLD,
} from '@/lib/structured-data';

export const metadata = {
  title: 'Newdryve · Early Access · Driving Lessons in Norwich',
  description:
    'Newdryve connects Norwich learners with verified ADI instructors — and automatically protects instructors from last-minute cancellations. Book in 60 seconds. 0% commission.',
  alternates: {
    canonical: '/',
  },
};

// Single source of truth for instructor pricing — used everywhere on the page.
const INSTRUCTOR_PRICE = '£29';

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

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[1px] text-deep-rose mb-3">
      {children}
    </p>
  );
}

function Check({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className={className}>
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6h7M6 2.5 9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Book',
    body: 'A learner finds you in the marketplace, sees your real availability and books a slot in 60 seconds — no calls, no voicemails.',
    accent: 'green' as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Secure',
    body: 'Their card is held on file the moment they book. Nothing is charged upfront — the slot in your diary is simply protected.',
    accent: 'green' as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="10" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Protected',
    body: 'Cancel inside 48 hours? Newdryve automatically charges 50% and pays it straight to you. We never take a cut.',
    accent: 'pink' as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const LEARNER_BENEFITS = [
  {
    title: 'Verified instructors',
    body: 'Every instructor is ADI-qualified and DBS-checked before they appear. No guesswork.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Real-time availability',
    body: 'See the next 14 days of genuine openings and tap a slot. No back-and-forth, no waiting list limbo.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Track your hours to test',
    body: 'A clear view of every lesson and your hours toward test day, so you always know where you stand.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <>
      <JsonLd data={[ORGANIZATION_JSONLD, WEBSITE_JSONLD, FAQ_JSONLD, BREADCRUMB_JSONLD]} />
      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-ink focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold ${focusRing}`}
      >
        Skip to content
      </a>

      <div className="bg-canvas text-ink min-h-screen">
        <SiteNav />

        <main id="main">
          {/* ───────────────────────── HERO ───────────────────────── */}
          <section className="hero-bg relative overflow-hidden">
            <div className="absolute inset-0 dot-pattern opacity-50 pointer-events-none" aria-hidden="true" />
            <div className="relative max-w-6xl mx-auto px-5 pt-10 pb-16 md:pt-24 md:pb-28 grid md:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
              {/* Left: text + CTAs */}
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full bg-blush-surface border border-blush-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1px] text-deep-rose">
                  <span className="size-1.5 rounded-full bg-deep-rose animate-pulse" aria-hidden="true" />
                  Norwich · Early access
                </span>

                <h1 className="font-display mt-5 text-[clamp(40px,7vw,68px)] font-semibold leading-[1.02] tracking-[-1.5px] text-balance">
                  Driving lessons,{' '}
                  <span className="gradient-text">finally sorted.</span>
                </h1>

                <p className="mt-6 text-lg text-ink-secondary leading-relaxed max-w-xl text-pretty">
                  <span className="text-ink font-semibold">Newdryve</span> connects Norwich learners with verified ADI
                  instructors — and automatically protects instructors from last-minute cancellations. Book in 60 seconds.
                </p>

                <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
                  <a
                    href="#signup-learner"
                    className={`inline-flex items-center justify-center gap-1.5 bg-deep-rose text-white rounded-full px-5 py-3.5 text-sm font-bold touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:bg-[#d8406b] shadow-[0_10px_28px_-10px_rgba(232,82,122,0.6)] ${focusRing}`}
                  >
                    Join the Norwich waitlist
                    <ArrowRight />
                  </a>
                  <a
                    href="#instructors"
                    className={`inline-flex items-center justify-center gap-1.5 bg-white text-ink border border-[#E8E8F2] rounded-full px-5 py-3.5 text-sm font-bold touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:border-ink ${focusRing}`}
                  >
                    I&rsquo;m an instructor
                  </a>
                </div>

                <p className="mt-5 text-sm text-ink-secondary flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="inline-flex items-center gap-1.5 text-racing-green font-semibold">
                    <Check />
                    0% commission
                  </span>
                  <span className="text-ink-muted" aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1.5 text-racing-green font-semibold">
                    <Check />
                    Free until your first booking
                  </span>
                </p>
              </Reveal>

              {/* Right: animated phone preview with soft teal glow */}
              <Reveal delay={120} className="relative">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 blur-3xl opacity-70"
                  style={{
                    background:
                      'radial-gradient(ellipse 60% 55% at 55% 45%, rgba(45,106,79,0.30), transparent 70%)',
                  }}
                />
                <div className="relative w-full max-w-[300px] sm:max-w-[340px] md:max-w-[360px] mx-auto md:ml-auto md:mr-0 motion-safe:float-slow">
                  <BookingFlowPlayer />
                  <div
                    aria-hidden="true"
                    className="hidden md:flex absolute -left-6 top-10 bg-white border border-[#E8E8F2] rounded-2xl px-4 py-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.18)] gap-3 items-center"
                  >
                    <span className="size-9 rounded-full bg-deep-rose/10 text-deep-rose flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path d="M3 9a6 6 0 1 1 12 0A6 6 0 0 1 3 9z" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M9 5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Preview</div>
                      <div className="text-sm font-extrabold text-ink leading-tight">The experience we&rsquo;re building</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ───────────────────── TRUST STRIP ───────────────────── */}
          <section aria-label="What makes Newdryve trustworthy" className="bg-white border-y border-[#E8E8F2]">
            <ul className="max-w-6xl mx-auto px-5 py-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
              {[
                'DBS-checked instructors',
                'ADI-qualified',
                'Card-protected bookings',
                'Built in Norwich',
              ].map((item) => (
                <li
                  key={item}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-ink-secondary"
                >
                  <Check className="text-ink-muted" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* ───────────────────── THE PROBLEM ───────────────────── */}
          <section className="bg-canvas">
            <div className="max-w-6xl mx-auto px-5 py-16 md:py-24 grid md:grid-cols-[1.1fr_0.9fr] gap-10 md:gap-16 items-center">
              <Reveal>
                <SectionEyebrow>The problem</SectionEyebrow>
                <h2 className="font-display text-[clamp(30px,4.5vw,48px)] font-semibold tracking-[-1px] leading-[1.08] text-balance">
                  Instructors lose over{' '}
                  <span className="text-deep-rose">£4,000 a year</span>{' '}
                  to last-minute cancellations.
                </h2>
                <p className="mt-5 text-base text-ink-secondary leading-relaxed max-w-md text-pretty">
                  A learner cancels the night before and the slot is gone — no lesson, no income, no notice. Diary apps
                  let you <em>record</em> that loss. They don&rsquo;t stop it. Newdryve does, automatically.
                </p>
              </Reveal>

              {/* Cancelled-lesson card with a red strike */}
              <Reveal delay={120} className="relative">
                <div className="bg-white border border-[#E8E8F2] rounded-2xl p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] max-w-sm mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Tomorrow · 9:00 am</div>
                    <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-[#FBE9EE] text-deep-rose">
                      Cancelled
                    </span>
                  </div>
                  <div className="relative flex items-center gap-3">
                    <span className="size-11 rounded-full bg-canvas flex items-center justify-center text-ink-secondary font-bold">JL</span>
                    <div className="flex-1">
                      <div className="font-bold text-ink">2-hour lesson</div>
                      <div className="text-sm text-ink-secondary tabular-nums">£76.00</div>
                    </div>
                    <span aria-hidden="true" className="absolute left-0 right-0 top-1/2 h-[2px] bg-deep-rose rotate-[-4deg]" />
                  </div>
                  <div className="mt-5 pt-4 border-t border-[#E8E8F2] flex items-center justify-between text-sm">
                    <span className="text-ink-secondary">Without protection</span>
                    <span className="font-bold text-deep-rose tabular-nums">− £76.00</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-ink-secondary">With Newdryve</span>
                    <span className="font-bold text-racing-green tabular-nums">+ £38.00 paid to you</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ─────────────────── HOW IT WORKS ─────────────────── */}
          <section id="how-it-works" className="bg-white border-y border-[#E8E8F2]">
            <div className="max-w-6xl mx-auto px-5 py-16 md:py-24">
              <Reveal className="max-w-2xl mb-10 md:mb-14">
                <SectionEyebrow>How it works</SectionEyebrow>
                <h2 className="font-display text-[clamp(30px,4.5vw,48px)] font-semibold tracking-[-1px] leading-[1.08] text-balance">
                  Book, secure, protected.
                </h2>
                <p className="mt-4 text-base text-ink-secondary text-pretty">
                  Three steps. The income protection is built in — not a checkbox you have to remember.
                </p>
              </Reveal>

              <div className="grid md:grid-cols-3 gap-5">
                {HOW_IT_WORKS.map((s, i) => {
                  const isPink = s.accent === 'pink';
                  return (
                    <Reveal
                      as="article"
                      key={s.step}
                      delay={i * 100}
                      className={`relative rounded-2xl border p-7 motion-safe:transition-shadow ${
                        isPink
                          ? 'bg-racing-green text-white border-racing-green shadow-[0_24px_60px_-24px_rgba(45,106,79,0.6)]'
                          : 'bg-canvas border-[#E8E8F2] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-5">
                        <span
                          className={`flex items-center justify-center size-12 rounded-full ${
                            isPink ? 'bg-white/15 text-white' : 'bg-racing-green/10 text-racing-green'
                          }`}
                        >
                          {s.icon}
                        </span>
                        <span
                          className={`font-display text-2xl font-semibold tabular-nums ${
                            isPink ? 'text-white/40' : 'text-ink-muted'
                          }`}
                        >
                          {s.step}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold tracking-[-0.3px] flex items-center gap-2">
                        {s.title}
                        {isPink && (
                          <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-deep-rose text-white">
                            The payoff
                          </span>
                        )}
                      </h3>
                      <p
                        className={`mt-2.5 text-sm leading-relaxed ${
                          isPink ? 'text-white/80' : 'text-ink-secondary'
                        }`}
                      >
                        {s.body}
                      </p>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ───────────── MARKETPLACE DIFFERENTIATOR (centrepiece) ───────────── */}
          <section className="bg-canvas">
            <div className="max-w-6xl mx-auto px-5 py-16 md:py-24">
              <Reveal className="max-w-2xl mb-10 md:mb-14">
                <SectionEyebrow>Why Newdryve is different</SectionEyebrow>
                <h2 className="font-display text-[clamp(32px,5vw,52px)] font-semibold tracking-[-1.2px] leading-[1.05] text-balance">
                  Other apps manage your diary.{' '}
                  <span className="gradient-text">Newdryve fills it.</span>
                </h2>
                <p className="mt-4 text-base text-ink-secondary text-pretty">
                  Diary software helps you keep the students you already have. Newdryve is a marketplace — learners come
                  to <em>you</em> — with automatic cancellation protection on top.
                </p>
              </Reveal>

              <div className="grid md:grid-cols-2 gap-5 items-stretch">
                {/* Diary software */}
                <Reveal className="rounded-3xl border border-[#E8E8F2] bg-white p-7 md:p-8 flex flex-col">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1">Diary software</div>
                  <div className="text-lg font-bold text-ink-secondary mb-6">Manages students you already have</div>
                  <ul className="flex flex-col gap-3.5 text-sm text-ink-secondary">
                    {[
                      'You still have to find new students yourself',
                      'Cancellations are recorded by hand — never enforced',
                      'No way to fill an empty slot at short notice',
                      'Monthly fee, and sometimes commission on top',
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <span className="mt-0.5 flex-shrink-0 size-5 rounded-full bg-canvas flex items-center justify-center text-ink-muted">
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                            <path d="M3 3l5 5M8 3l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>

                {/* Newdryve (highlighted, teal) */}
                <Reveal
                  delay={120}
                  className="relative rounded-3xl bg-racing-green text-white p-7 md:p-8 flex flex-col shadow-[0_30px_80px_-30px_rgba(45,106,79,0.7)] overflow-hidden"
                >
                  <div className="absolute -top-16 -right-16 size-48 rounded-full bg-deep-rose/20 blur-2xl" aria-hidden="true" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-1">
                      <Logo size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-deep-rose text-white">
                        Marketplace
                      </span>
                    </div>
                    <div className="text-lg font-bold mb-6">Brings you new learners — and protects your income</div>
                    <ul className="flex flex-col gap-3.5 text-sm">
                      {[
                        'A marketplace of Norwich learners discovers and books you',
                        'Empty diary slots get filled with NEW students',
                        'Late cancellations auto-charge 50%, paid straight to you',
                        '0% commission, forever — keep 100% of every lesson',
                      ].map((t) => (
                        <li key={t} className="flex items-start gap-3">
                          <span className="mt-0.5 flex-shrink-0 size-5 rounded-full bg-white/15 flex items-center justify-center text-white">
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                              <path d="M3 5.5l1.5 1.5 3.5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <span className="text-white/90">{t}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#signup-instructor"
                      className={`mt-7 inline-flex items-center gap-1.5 bg-white text-racing-green rounded-full px-5 py-3 text-sm font-bold touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 ${focusRing} focus-visible:ring-offset-racing-green`}
                    >
                      Apply as a founding instructor
                      <ArrowRight />
                    </a>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ───────────────────── FOR LEARNERS ───────────────────── */}
          <section id="learners" className="bg-white border-y border-[#E8E8F2]">
            <div className="max-w-6xl mx-auto px-5 py-16 md:py-24 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              <Reveal>
                <SectionEyebrow>For learners</SectionEyebrow>
                <h2 className="font-display text-[clamp(30px,4.5vw,46px)] font-semibold tracking-[-1px] leading-[1.08] text-balance">
                  Find an instructor. See real availability. Book instantly.
                </h2>
                <p className="mt-4 text-base text-ink-secondary leading-relaxed max-w-md text-pretty">
                  No phone calls, no voicemails, no waiting. Just pick a verified instructor and a slot that works.
                </p>

                <ul className="mt-7 flex flex-col gap-5">
                  {LEARNER_BENEFITS.map((b) => (
                    <li key={b.title} className="flex items-start gap-4">
                      <span className="flex-shrink-0 flex items-center justify-center size-11 rounded-xl bg-racing-green/10 text-racing-green">
                        {b.icon}
                      </span>
                      <div>
                        <div className="font-bold text-ink">{b.title}</div>
                        <p className="mt-1 text-sm text-ink-secondary leading-relaxed">{b.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <a
                  href="#signup-learner"
                  className={`mt-8 inline-flex items-center gap-1.5 bg-deep-rose text-white rounded-full px-5 py-3.5 text-sm font-bold touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:bg-[#d8406b] shadow-[0_10px_28px_-10px_rgba(232,82,122,0.6)] ${focusRing}`}
                >
                  Join the Norwich waitlist
                  <ArrowRight />
                </a>
              </Reveal>

              {/* Learner booking-flow mockup */}
              <Reveal delay={120} className="relative">
                <span className="absolute -top-3 left-4 z-10 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-ink text-white rounded-full px-2.5 py-1">
                  Preview
                </span>
                <div className="bg-canvas border border-[#E8E8F2] rounded-3xl p-5 sm:p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.14)]">
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    Sarah Mitchell · pick a slot
                  </div>
                  <MiniSlotPicker selectedIndex={3} />
                </div>
              </Reveal>
            </div>
          </section>

          {/* ───────────────────── FOR INSTRUCTORS ───────────────────── */}
          <section id="instructors" className="bg-ink text-white">
            <div className="max-w-6xl mx-auto px-5 py-16 md:py-24 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
              <Reveal>
                <p className="text-[11px] font-bold uppercase tracking-[1px] text-deep-rose mb-3">For instructors</p>
                <h2 className="font-display text-[clamp(30px,4.5vw,46px)] font-semibold tracking-[-1px] leading-[1.08] text-balance">
                  Built for instructors who&rsquo;d rather teach than chase payments.
                </h2>
                <p className="mt-5 text-base text-white/60 leading-relaxed max-w-md text-pretty">
                  We&rsquo;re hand-picking a founding cohort of ADI-qualified instructors in and around Norwich. You keep
                  your pricing, your schedule and <span className="text-white font-semibold">100% of every lesson</span>.
                </p>
                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md">
                  {[
                    'Automatic 50% charge on late cancellations — paid to you',
                    'Set your own availability',
                    'Keep your own pricing',
                    '0% commission, forever',
                    'Free until your first booking',
                    `Then a flat ${INSTRUCTOR_PRICE}/month — no per-booking cuts`,
                  ].map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-white/80">
                      <span className="mt-0.5 size-4 rounded-full bg-racing-green/30 border border-racing-green flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                          <path d="M1.5 4l1.5 1.5 3.5-3.5" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#signup-instructor"
                  className={`mt-8 inline-flex items-center gap-1.5 bg-racing-green hover:bg-racing-green-dark text-white rounded-full px-5 py-3.5 text-sm font-bold touch-manipulation motion-safe:transition-colors ${focusRing} focus-visible:ring-offset-ink`}
                >
                  Apply as a founding instructor
                  <ArrowRight />
                </a>
              </Reveal>

              {/* Instructor dashboard mockup, clearly labelled as concept */}
              <Reveal delay={120} className="relative">
                <span className="absolute -top-3 left-4 z-10 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-deep-rose text-white rounded-full px-2.5 py-1">
                  Concept · not live
                </span>
                <div className="bg-[#13131F] border border-white/10 rounded-2xl p-5 shadow-[0_30px_80px_-20px_rgba(45,106,79,0.4)]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">Good morning</div>
                      <div className="text-lg font-extrabold tracking-[-0.3px]">Today&rsquo;s overview</div>
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1"
                      style={{ background: 'rgba(0,194,122,0.18)', color: '#4ADE80' }}
                    >
                      Demo
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { label: 'Lessons today', value: '4', sub: 'example data' },
                      { label: 'This week', value: '21', sub: 'example data' },
                      { label: 'Capacity used', value: '78%', sub: 'this week' },
                      { label: 'Hours given', value: '340', sub: 'all-time' },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">{s.label}</div>
                        <div className="mt-1 text-2xl font-extrabold tracking-[-0.5px] tabular-nums">{s.value}</div>
                        <div className="text-[11px] text-white/50 tabular-nums">{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-baseline justify-between mb-3">
                      <div className="text-xs font-bold text-white/70">Earnings · last 7 days</div>
                      <div className="text-xs font-bold tabular-nums text-white/40">demo</div>
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
                </div>
              </Reveal>
            </div>
          </section>

          {/* ───────────────────── PRICING ───────────────────── */}
          <section id="pricing" className="bg-canvas">
            <div className="max-w-5xl mx-auto px-5 py-16 md:py-24">
              <Reveal className="max-w-2xl mb-10 md:mb-14">
                <SectionEyebrow>Pricing</SectionEyebrow>
                <h2 className="font-display text-[clamp(30px,4.5vw,48px)] font-semibold tracking-[-1px] leading-[1.08] text-balance">
                  Simple, honest pricing.
                </h2>
                <p className="mt-4 text-base text-ink-secondary text-pretty">
                  No tiers, no per-booking cuts, no surprises. One price for instructors, always free for learners.
                </p>
              </Reveal>

              <div className="grid md:grid-cols-2 gap-5 items-stretch">
                {/* Learners */}
                <Reveal className="rounded-3xl border border-[#E8E8F2] bg-white p-8 flex flex-col">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-deep-rose mb-2">For learners</div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-5xl font-semibold tracking-[-1px]">Free</span>
                    <span className="text-ink-secondary font-medium">always</span>
                  </div>
                  <p className="mt-4 text-sm text-ink-secondary leading-relaxed">
                    Newdryve never adds a booking fee or platform charge. You pay your instructor directly for the lesson —
                    nothing more.
                  </p>
                  <ul className="mt-6 flex flex-col gap-2.5 text-sm text-ink-secondary">
                    {['No booking fees, ever', 'Pay by card, bank transfer or cash', 'Cancel a lesson up to 48h before, free'].map((t) => (
                      <li key={t} className="flex items-center gap-2.5">
                        <Check className="text-racing-green flex-shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#signup-learner"
                    className={`mt-auto pt-8 inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:text-racing-green motion-safe:transition-colors rounded-md ${focusRing}`}
                  >
                    Join the Norwich waitlist
                    <ArrowRight />
                  </a>
                </Reveal>

                {/* Instructors (highlighted) */}
                <Reveal delay={120} className="relative rounded-3xl border-2 border-racing-green bg-white p-8 flex flex-col shadow-[0_30px_70px_-30px_rgba(45,106,79,0.45)]">
                  <span className="absolute -top-3 right-6 inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-racing-green text-white rounded-full px-3 py-1">
                    Founding cohort
                  </span>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-racing-green mb-2">For instructors</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-5xl font-semibold tracking-[-1px]">{INSTRUCTOR_PRICE}</span>
                    <span className="text-ink-secondary font-medium">/month</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-racing-green">Free until your first booking</p>
                  <p className="mt-3 text-sm text-ink-secondary leading-relaxed">
                    0% commission, forever. The cancellation protection alone recovers more than that in the first month
                    for most instructors.
                  </p>
                  <ul className="mt-6 flex flex-col gap-2.5 text-sm text-ink-secondary">
                    {['0% commission on every booking', 'Automatic cancellation protection', 'Set your own pricing & availability', 'Cancel anytime'].map((t) => (
                      <li key={t} className="flex items-center gap-2.5">
                        <Check className="text-racing-green flex-shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#signup-instructor"
                    className={`mt-auto pt-8 inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:text-racing-green motion-safe:transition-colors rounded-md ${focusRing}`}
                  >
                    Apply as a founding instructor
                    <ArrowRight />
                  </a>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ───────────────── FOUNDING COHORT / SOCIAL PROOF ───────────────── */}
          <section className="bg-white border-y border-[#E8E8F2]">
            <div className="max-w-4xl mx-auto px-5 py-16 md:py-24 text-center">
              <Reveal>
                <SectionEyebrow>Our founding cohort</SectionEyebrow>
                <h2 className="font-display text-[clamp(28px,4vw,42px)] font-semibold tracking-[-1px] leading-[1.1] text-balance">
                  We&rsquo;re hand-picking our founding instructors in Norwich.
                </h2>
                <p className="mt-5 text-base text-ink-secondary leading-relaxed max-w-2xl mx-auto text-pretty">
                  We&rsquo;d rather start small and get it right than fake a crowd. We&rsquo;re onboarding a limited group
                  of ADI-qualified instructors now — and learners who want first access when bookings open. No inflated
                  numbers, no invented reviews. Just the people building Newdryve with us from day one.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <a
                    href="#signup-instructor"
                    className={`inline-flex items-center gap-1.5 bg-ink text-white rounded-full px-5 py-3.5 text-sm font-bold touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:bg-[#1a1a2c] ${focusRing}`}
                  >
                    Become a founding instructor
                    <ArrowRight />
                  </a>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ───────────────────── SIGNUP ───────────────────── */}
          <section id="signup" className="bg-canvas scroll-mt-20">
            <div className="max-w-6xl mx-auto px-5 py-16 md:py-24 grid lg:grid-cols-2 gap-10 lg:gap-16">
              <Reveal id="signup-learner" className="flex flex-col scroll-mt-20">
                <SectionEyebrow>For learners</SectionEyebrow>
                <h2 className="font-display text-[clamp(26px,3.5vw,38px)] font-semibold tracking-[-1px] leading-[1.1] text-balance mb-2">
                  Be first in line for lessons in Norwich.
                </h2>
                <p className="text-base text-ink-secondary text-pretty mb-6">
                  Tell us a little about yourself and we&rsquo;ll be in touch as soon as we have an instructor for you.
                </p>
                <WaitlistForm defaultRole="student" />
              </Reveal>

              <Reveal id="signup-instructor" delay={120} className="flex flex-col scroll-mt-20">
                <SectionEyebrow>For instructors</SectionEyebrow>
                <h2 className="font-display text-[clamp(26px,3.5vw,38px)] font-semibold tracking-[-1px] leading-[1.1] text-balance mb-2">
                  Apply to teach with Newdryve.
                </h2>
                <p className="text-base text-ink-secondary text-pretty mb-6">
                  We&rsquo;re onboarding a small founding group of ADI-qualified instructors. If that&rsquo;s you, tell us about your work.
                </p>
                <WaitlistForm defaultRole="instructor" />
              </Reveal>
            </div>
          </section>

          {/* ───────────────────── FAQ ───────────────────── */}
          <section id="faq" className="bg-white border-y border-[#E8E8F2]">
            <div className="max-w-3xl mx-auto px-5 py-16 md:py-24">
              <Reveal className="text-center mb-8 md:mb-10">
                <SectionEyebrow>Frequently asked</SectionEyebrow>
                <h2 className="font-display text-[clamp(30px,4.5vw,46px)] font-semibold tracking-[-1px] leading-[1.1] text-balance">
                  Everything you need to know.
                </h2>
              </Reveal>

              <div className="flex flex-col gap-3">
                {FAQ_ITEMS.map((item, i) => (
                  <Reveal
                    as="details"
                    key={item.q}
                    delay={i * 40}
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
                    <p className="mt-3 text-sm text-ink-secondary leading-relaxed text-pretty">{item.a}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ───────────────────── FINAL CTA BAND ───────────────────── */}
          <section className="bg-racing-green text-white relative overflow-hidden">
            <div className="absolute -top-24 -right-24 size-72 rounded-full bg-deep-rose/20 blur-3xl" aria-hidden="true" />
            <div className="relative max-w-3xl mx-auto px-5 py-16 md:py-24 text-center">
              <h2 className="font-display text-[clamp(32px,5vw,52px)] font-semibold tracking-[-1px] leading-[1.05] text-balance">
                Help us build it.
              </h2>
              <p className="mt-5 text-base md:text-lg text-white/70 text-pretty max-w-xl mx-auto">
                Whether you want to learn or you teach, join the first cohort in Norwich and shape what Newdryve becomes.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a
                  href="#signup-learner"
                  className={`inline-flex items-center gap-1.5 bg-white text-racing-green rounded-full px-6 py-3.5 text-sm font-bold touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 ${focusRing} focus-visible:ring-offset-racing-green`}
                >
                  Join as a learner
                  <ArrowRight />
                </a>
                <a
                  href="#signup-instructor"
                  className={`inline-flex items-center gap-1.5 bg-deep-rose text-white rounded-full px-6 py-3.5 text-sm font-bold touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:bg-[#d8406b] ${focusRing} focus-visible:ring-offset-racing-green`}
                >
                  Join as an instructor
                  <ArrowRight />
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* ───────────────────── FOOTER ───────────────────── */}
        <footer className="bg-white border-t border-[#E8E8F2]">
          <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <Link href="/" aria-label="Newdryve home" className={`rounded-md p-1 -m-1 self-start ${focusRing}`}>
              <Logo size={20} />
            </Link>
            <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold">
              <a href="#how-it-works" className={`text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md ${focusRing}`}>
                How it works
              </a>
              <a href="#pricing" className={`text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md ${focusRing}`}>
                Pricing
              </a>
              <a href="#faq" className={`text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md ${focusRing}`}>
                FAQ
              </a>
              <Link href="/privacy" className={`text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md ${focusRing}`}>
                Privacy Policy
              </Link>
              <Link href="/terms" className={`text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md ${focusRing}`}>
                Terms
              </Link>
              <a
                href="https://instagram.com/newdryve"
                target="_blank"
                rel="noopener noreferrer"
                className={`text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md ${focusRing}`}
              >
                Instagram
              </a>
            </nav>
          </div>
          <div className="max-w-6xl mx-auto px-5 pb-8 -mt-2">
            <p className="text-xs text-ink-muted">© {new Date().getFullYear()} Newdryve. All rights reserved. Built in Norwich.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
