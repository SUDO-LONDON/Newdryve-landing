import Link from 'next/link';
import { BookingFlowPlayer } from '@/components/landing/BookingFlowPlayer';
import { RotatingName } from '@/components/landing/RotatingName';
import { MiniSlotPicker } from '@/components/landing/MiniSlotPicker';
import { WaitlistForm } from '@/components/landing/WaitlistForm';
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
    'Newdryve is an early-access driving-lesson platform launching in Norwich. Apply now as a learner or as an ADI-qualified instructor to join the first cohort.',
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

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[1px] text-deep-rose mb-3">
      {children}
    </p>
  );
}

const PAYMENT_METHODS = [
  {
    title: 'Card',
    sub: 'Visa, Mastercard, Apple Pay',
    badge: 'Planned',
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
          FAQ_JSONLD,
          BREADCRUMB_JSONLD,
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
                href="#preview"
                className={`hidden sm:inline-block text-sm font-semibold text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md px-2 py-1 ${focusRing}`}
              >
                What we&rsquo;re building
              </a>
              <a
                href="#instructors"
                className={`hidden sm:inline-block text-sm font-semibold text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md px-2 py-1 ${focusRing}`}
              >
                For instructors
              </a>
              <a
                href="#signup"
                className={`inline-flex items-center gap-1.5 bg-ink text-white rounded-full px-3.5 sm:px-4 py-2 text-sm font-bold tracking-tight touch-manipulation motion-safe:transition-colors hover:bg-[#1a1a2c] ${focusRing}`}
              >
                <span className="sm:hidden">Apply</span>
                <span className="hidden sm:inline">Apply for early access</span>
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
            <div className="relative max-w-6xl mx-auto px-5 pt-10 pb-14 md:pt-24 md:pb-28 grid md:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
              {/* Left: text + CTAs */}
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-blush-surface border border-blush-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[1px] text-deep-rose">
                  <span className="size-1.5 rounded-full bg-deep-rose animate-pulse" aria-hidden="true" />
                  Norwich · Early access · Apply now
                </span>

                <h1 className="mt-5 text-[clamp(36px,6.5vw,64px)] font-extrabold leading-[1.05] tracking-[-1.5px] text-balance">
                  Learn to drive with{' '}
                  <RotatingName />
                  {' '}without the back-and-forth.
                </h1>

                <p className="mt-5 text-lg text-ink-secondary leading-relaxed max-w-xl text-pretty">
                  We&rsquo;re building <span className="text-ink font-semibold">Newdryve</span>, a faster way to find an ADI-qualified instructor in Norwich, see real availability, and book a lesson in 60 seconds.{' '}
                  <span className="text-ink font-semibold">It&rsquo;s not live yet.</span> We&rsquo;re recruiting our first cohort of learners and instructors right now.
                </p>

                <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
                  <a
                    href="#signup"
                    className={`inline-flex items-center justify-center gap-1.5 bg-ink text-white rounded-full px-5 py-3 text-sm font-bold touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:bg-[#1a1a2c] ${focusRing}`}
                  >
                    Join as a learner
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2.5 6h7M6 2.5 9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                  <a
                    href="#instructors"
                    className={`inline-flex items-center justify-center gap-1.5 bg-white text-ink border border-[#E8E8F2] rounded-full px-5 py-3 text-sm font-bold touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:border-ink ${focusRing}`}
                  >
                    Apply as an instructor
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2.5 6h7M6 2.5 9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>

                <ul className="mt-6 flex flex-col gap-2 text-sm text-ink-secondary">
                  <li className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="6" stroke="#00875A" strokeWidth="1.5" />
                      <path d="M4 7l2 2 4-4" stroke="#00875A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span><span className="text-ink font-semibold">0% commission</span> on every booking, forever</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="6" stroke="#00875A" strokeWidth="1.5" />
                      <path d="M4 7l2 2 4-4" stroke="#00875A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span><span className="text-ink font-semibold">Free</span> until you get your first booking</span>
                  </li>
                </ul>
              </div>

              {/* Right: animated phone preview */}
              <div className="relative">
                <div className="relative w-full max-w-[300px] sm:max-w-[340px] md:max-w-[360px] mx-auto md:ml-auto md:mr-0">
                  <BookingFlowPlayer />
                  {/* preview label */}
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
                  <div
                    aria-hidden="true"
                    className="hidden md:flex absolute -right-4 bottom-24 bg-white border border-[#E8E8F2] rounded-2xl px-3 py-2.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.18)] gap-2 items-center"
                  >
                    <span className="size-8 rounded-full bg-racing-green text-white flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path d="M4 9l3 3 7-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-xs font-bold text-ink leading-tight">Concept design</div>
                      <div className="text-[10px] text-ink-secondary">Not live data</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* WHAT WE'RE BUILDING - design preview */}
          <section id="preview" className="bg-canvas">
            <div className="max-w-6xl mx-auto px-5 py-14 md:py-20">
              <div className="max-w-2xl mb-10 md:mb-12">
                <SectionEyebrow>Preview · Designs, not live product</SectionEyebrow>
                <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-[-1px] leading-[1.1] text-balance">
                  What we&rsquo;re building.
                </h2>
                <p className="mt-4 text-base text-ink-secondary text-pretty">
                  Here&rsquo;s the shape of the product. Nothing on this page is live yet. These are designs we&rsquo;re actively shipping with our early-access cohort.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {/* Feature 1 */}
                <article className="bg-white rounded-2xl border border-[#E8E8F2] p-6 flex flex-col gap-5 min-w-0 motion-safe:transition-shadow motion-safe:hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]">
                  <div className="rounded-xl bg-canvas p-4 -m-2 mb-0 min-w-0">
                    <MiniSlotPicker selectedIndex={3} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-[-0.3px] text-balance">
                      Real-time availability, no chasing callbacks.
                    </h3>
                    <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
                      Each instructor sets their own schedule. Learners see the next 14 days of real openings and tap a slot to book.
                    </p>
                  </div>
                </article>

                {/* Feature 2 */}
                <article className="bg-white rounded-2xl border border-[#E8E8F2] p-6 flex flex-col gap-5 min-w-0 motion-safe:transition-shadow motion-safe:hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]">
                  <div className="rounded-xl bg-canvas p-4 flex flex-col gap-2 min-w-0">
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
                      Pay your way: card, bank transfer, or cash.
                    </h3>
                    <p className="mt-2 text-sm text-ink-secondary leading-relaxed">
                      No surprise fees, no hidden charges. We&rsquo;re designing payments around how driving lessons actually get paid for.
                    </p>
                  </div>
                </article>

                {/* Feature 3 */}
                <article className="bg-white rounded-2xl border border-[#E8E8F2] p-6 flex flex-col gap-5 min-w-0 motion-safe:transition-shadow motion-safe:hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]">
                  <div className="rounded-xl bg-canvas p-4 min-w-0">
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
                      A clear view of your lesson history and hours toward your test, so you always know where you are.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </section>

          {/* FOR INSTRUCTORS */}
          <section id="instructors" className="bg-ink text-white">
            <div className="max-w-6xl mx-auto px-5 py-14 md:py-20 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[1px] text-deep-rose mb-3">For instructors</p>
                <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-[-1px] leading-[1.1] text-balance">
                  We&rsquo;re recruiting a founding group of instructors.{' '}
                  <span className="gradient-text">Want in?</span>
                </h2>
                <p className="mt-4 text-base text-white/60 leading-relaxed max-w-md text-pretty">
                  We&rsquo;re looking for a small number of ADI-qualified instructors in and around Norwich to help us shape the platform. You keep full control of your schedule and pricing, and <span className="text-white font-semibold">100% of every lesson</span>. We take 0% commission. After your first booking, you pay a simple flat monthly fee. That&rsquo;s it.
                </p>
                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md">
                  {[
                    'Set your own availability',
                    'Keep your own pricing',
                    '0% commission, forever',
                    'Free until your first booking',
                    'Flat monthly fee after that',
                    'Keep 100% of every lesson',
                  ].map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-white/80">
                      <span className="size-4 rounded-full bg-racing-green/30 border border-racing-green flex items-center justify-center flex-shrink-0">
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
                  className={`mt-7 inline-flex items-center gap-1.5 bg-racing-green hover:bg-racing-green-dark text-white rounded-full px-5 py-3 text-sm font-bold touch-manipulation motion-safe:transition-colors ${focusRing}`}
                >
                  Apply as an instructor
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.5 6h7M6 2.5 9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>

              {/* Mini dashboard mockup, clearly labelled as design */}
              <div className="relative">
                <span className="absolute -top-3 left-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-deep-rose text-white rounded-full px-2.5 py-1 z-10">
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
              </div>
            </div>
          </section>

          {/* SIGNUP */}
          <section id="signup" className="bg-canvas">
            <div className="max-w-6xl mx-auto px-5 py-14 md:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16">
              <div id="signup-learner" className="flex flex-col">
                <SectionEyebrow>For learners</SectionEyebrow>
                <h2 className="text-[clamp(26px,3.5vw,36px)] font-extrabold tracking-[-1px] leading-[1.1] text-balance mb-2">
                  Be first in line for lessons in Norwich.
                </h2>
                <p className="text-base text-ink-secondary text-pretty mb-6">
                  Tell us a little about yourself and we&rsquo;ll be in touch as soon as we have an instructor for you.
                </p>
                <WaitlistForm defaultRole="student" />
              </div>

              <div id="signup-instructor" className="flex flex-col">
                <SectionEyebrow>For instructors</SectionEyebrow>
                <h2 className="text-[clamp(26px,3.5vw,36px)] font-extrabold tracking-[-1px] leading-[1.1] text-balance mb-2">
                  Apply to teach with Newdryve.
                </h2>
                <p className="text-base text-ink-secondary text-pretty mb-6">
                  We&rsquo;re onboarding a small founding group of ADI-qualified instructors. If that&rsquo;s you, tell us about your work.
                </p>
                <WaitlistForm defaultRole="instructor" />
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="bg-white border-y border-[#E8E8F2]">
            <div className="max-w-3xl mx-auto px-5 py-14 md:py-20">
              <div className="text-center mb-8 md:mb-10">
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
            <div className="max-w-3xl mx-auto px-5 py-14 md:py-20 text-center">
              <div className="bg-white border border-[#E8E8F2] rounded-3xl px-5 py-10 sm:px-8 sm:py-14 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)]">
                <h2 className="text-[clamp(28px,4.5vw,40px)] font-extrabold tracking-[-1px] leading-[1.1] text-balance">
                  Help us build it.
                </h2>
                <p className="mt-4 text-base text-ink-secondary text-pretty">
                  Whether you want to learn or you teach, join the first cohort in Norwich and shape what Newdryve becomes.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <a
                    href="#signup-learner"
                    className={`inline-flex items-center gap-1.5 bg-ink text-white rounded-full px-5 py-3 text-sm font-bold touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:bg-[#1a1a2c] ${focusRing}`}
                  >
                    Join as a learner
                  </a>
                  <a
                    href="#signup-instructor"
                    className={`inline-flex items-center gap-1.5 bg-white border border-[#E8E8F2] text-ink rounded-full px-5 py-3 text-sm font-bold touch-manipulation motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 hover:border-ink ${focusRing}`}
                  >
                    Apply as an instructor
                  </a>
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
            <p className="text-xs text-ink-secondary">© {new Date().getFullYear()} Newdryve. All rights reserved.</p>
            <div className="flex items-center gap-5 text-xs font-semibold">
              <a href="#signup" className={`text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md ${focusRing}`}>
                Early access
              </a>
              <a href="#faq" className={`text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md ${focusRing}`}>
                FAQ
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
