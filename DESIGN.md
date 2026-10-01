# Newdryve — Frontend Design System

This document describes the visual language, tokens, components, and interaction
patterns used across the Newdryve marketing site (`app/`, `components/landing/`).
It's meant to keep new sections/pages consistent with what's already shipped.

Stack: Next.js 16 (App Router) · React 19 · Tailwind CSS v4 (CSS-first config,
no `tailwind.config.js`) · TypeScript.

---

## 1. Brand concept

Newdryve is a driving-lesson marketplace for Norwich. The design brief is
**"funded-startup editorial"**: warm, confident, a little premium — not a
generic SaaS dashboard, not a boy-racer driving-school clip-art site.

Two ideas run through every section:
- **Racing green** = trust, protection, "the safe choice" (instructor side).
- **Deep rose/pink** = energy, urgency, the CTA color (learner side / action).
- A **serif display face** (Fraunces) is reserved for headlines only, paired
  with a clean grotesque (DM Sans) for everything else — the classic
  editorial-meets-product contrast.

---

## 2. Design tokens

All tokens live in `app/globals.css` as CSS custom properties, then get mapped
into Tailwind's `@theme inline` block so they're usable as Tailwind utilities
(`bg-racing-green`, `text-deep-rose`, `rounded-3xl`, etc.) without a
`tailwind.config.js`.

### 2.1 Color

| Token | Hex | Tailwind class | Usage |
|---|---|---|---|
| `--racing-green` | `#2D6A4F` | `racing-green` | Primary brand color. Instructor sections, trust signals, secondary CTA hover, checkmarks. |
| `--racing-green-dark` | `#2D7A56` | `racing-green-dark` | Hover state for green buttons. |
| `--deep-rose` | `#E8527A` | `deep-rose` | Primary action color. Main CTAs, eyebrow labels, urgency/energy accents. |
| `--blush-surface` | `#F8F2F4` | `blush-surface` | Soft pink card backgrounds (badges, pills). |
| `--blush-border` | `#EDE0E5` | `blush-border` | Border for blush surfaces. |
| `--canvas` | `#F0EDF0` | `canvas` | Page background (warm off-white/lavender-grey, not pure white). |
| `--ink` | `#0A0A14` | `ink` | Primary text / near-black. Also used as a "dark section" background (instructors, footer CTAs). |
| `--ink-secondary` | `#6B6B84` | `ink-secondary` | Body copy, secondary text. |
| `--ink-muted` | `#9B9BB5` | `ink-muted` | Tertiary text, placeholders, disabled/step numbers. |
| `--border` | `#E8E8F2` | `border` (default) | Hairline borders. In practice most components hardcode `border-[#E8E8F2]` rather than the utility — see §7 for why. |
| `--ring` | `#2D6A4F` | — | Focus ring color (see §6 Accessibility). |
| `--background` / `--foreground` | `#F0EDF0` / `#0A0A14` | `bg-background` / `text-foreground` | Next.js theme defaults, mirror canvas/ink. |

Additional one-off colors used inline (not tokenized — mostly small dashboard
mockup accents that don't need reuse):
- `#4ADE80` — green checkmark accent inside the dark instructor dashboard mock.
- `#00875A` / `rgba(0,194,122,*)` — "DBS verified" badge green.
- `#13131F` — near-black card background for the instructor dashboard mockup (slightly lighter than `ink` for depth).
- `#d8406b` — deep-rose hover (manually darkened, no token).
- `#1a1a2c` — ink hover (manually lightened, no token).

**Color pairing rules:**
- Learner-facing CTAs and touch-points → **deep-rose**.
- Instructor-facing CTAs, protection/security messaging, positive deltas → **racing-green**.
- Never mix the two as adjacent CTA colors in the same visual group unless
  intentionally contrasting two audiences (e.g. final CTA band has one of each).
- `gradient-text` / `gradient-bg` utilities (green → rose, 90deg) are reserved
  for **one hero moment per section at most** — used on the H1 highlight word
  and one section heading ("Newdryve fills it."). Don't overuse; it's a signature move, not a default treatment.

### 2.2 Typography

- **Sans**: DM Sans (`next/font/google`), weights 400/500/600/700, exposed as `--font-dm-sans` → Tailwind `font-sans`. This is the default body face (see `html { font-family: var(--font-sans) }`).
- **Display**: Fraunces (variable font, `opsz` axis for optical sizing), exposed as `--font-fraunces` → used via the `.font-display` utility class, not a Tailwind font-family utility.
  - Applied via `className="font-display"` on every `<h1>`/`<h2>` in the landing page.
  - Always paired with tight tracking: `.font-display` sets `letter-spacing: -0.01em` globally, and headings additionally apply explicit tighter tracking utilities (e.g. `tracking-[-1.5px]`, `tracking-[-1px]`) at larger sizes.
  - Never use Fraunces for body copy, labels, or UI chrome — display-only.

**Heading scale** (all fluid via `clamp()`, all `font-display font-semibold`):

| Level | Size | Tracking | Line-height | Example |
|---|---|---|---|---|
| H1 (hero) | `clamp(40px, 7vw, 68px)` | `-1.5px` | `1.02` | "Driving lessons, finally sorted." |
| H2 (large, e.g. marketplace section) | `clamp(32px, 5vw, 52px)` | `-1.2px` | `1.05` | "Other apps manage your diary..." |
| H2 (standard section) | `clamp(30px, 4.5vw, 48px)` | `-1px` | `1.08` | "Book, secure, protected." |
| H2 (narrower section) | `clamp(30px, 4.5vw, 46px)` | `-1px` | `1.08` | "For learners" / "For instructors" |
| H2 (small) | `clamp(26px–28px, 3.5–4vw, 38–42px)` | `-1px` | `1.1` | Signup, social proof |

All headings use `text-balance` for wrapping.

**Body copy:**
- Default paragraph: `text-base text-ink-secondary leading-relaxed`, often with `text-pretty` and a `max-w-*` clamp for line length.
- Hero lede: `text-lg`.
- Eyebrow/label text (see `SectionEyebrow`): `text-[11px] font-bold uppercase tracking-[1px] text-deep-rose`.
- Numeric/tabular data (prices, stats, dates) always gets `tabular-nums`.

**Font loading**: both fonts self-hosted via `next/font/google`, `subsets: ["latin"]`, no external `<link>` tags, zero layout shift.

### 2.3 Radius

Defined once as `--radius: 0.625rem` (10px), then scaled via `@theme inline`:

| Class | Multiplier | Value |
|---|---|---|
| `rounded-sm` | ×0.6 | 6px |
| `rounded-md` | ×0.8 | 8px |
| `rounded-lg` | ×1 | 10px |
| `rounded-xl` | ×1.4 | 14px |
| `rounded-2xl` | ×1.8 | 18px |
| `rounded-3xl` | ×2.2 | 22px |

Usage convention:
- `rounded-full` — buttons, pills, badges, avatars.
- `rounded-2xl` — cards, form containers, FAQ items, mockup panels.
- `rounded-3xl` — larger feature cards (marketplace comparison cards, pricing cards, mockup phone-adjacent panels).
- `rounded-xl` — icon tiles, inputs.

### 2.4 Spacing & layout

- Page content max-width: **`max-w-6xl`** (section containers), **`max-w-5xl`** (pricing), **`max-w-4xl`**/**`max-w-3xl`** (narrower text-centric sections like social proof, FAQ).
- Horizontal gutter: **`px-5`** everywhere at the container level.
- Section vertical rhythm: **`py-16 md:py-24`** — this is the one consistent beat across every section on the page. Don't deviate without reason.
- Grid gaps: `gap-5` for card grids, `gap-10`/`gap-16` for two-column text+visual layouts.
- Section separators: alternate `bg-canvas` / `bg-white`, divided by `border-y border-[#E8E8F2]` on the white sections (no shadow, just a hairline).

### 2.5 Elevation (shadows)

No generic `shadow-md`/`shadow-lg` Tailwind utilities are used — every shadow
is a hand-tuned arbitrary value keyed to the element's brand color, e.g.:

- Rose CTA: `shadow-[0_10px_28px_-10px_rgba(232,82,122,0.6)]`
- Green feature card: `shadow-[0_24px_60px_-24px_rgba(45,106,79,0.6)]`
- Neutral card lift: `shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)]`
- Nav on scroll: `shadow-[0_4px_24px_-12px_rgba(0,0,0,0.18)]`

Pattern: **large blur, large negative spread, low opacity, tinted to the
surface's dominant color.** This is what gives cards a "floating" rather than
"boxed" feel. When adding a new colored surface, tint its shadow to match
rather than reaching for a neutral gray shadow.

---

## 3. Backgrounds & texture

Three reusable background utilities (in `globals.css`, `@layer utilities`):

- **`.hero-bg`** — two soft radial gradients (rose top-right, green bottom-left) over the canvas color. Used once, on the hero section only.
- **`.dot-pattern`** — subtle 24px dot grid (`rgba(10,10,20,0.06)`), layered at `opacity-50` over `.hero-bg`. Gives the hero quiet texture without noise.
- **`.gradient-text`** / **`.gradient-bg`** — green→rose 90° gradient, text-clip or background. Signature accent, used sparingly (see §2.1).

Dark sections (`bg-ink`, `bg-racing-green`) get their own accent: a single
large soft blurred circle in the opposite brand color (`bg-deep-rose/20
blur-3xl`, sized `size-48` to `size-72`), positioned off-canvas at a corner
(`-top-24 -right-24` etc.) — this is the "glow" motif that appears on the
instructor section, the marketplace comparison card, and the final CTA band.

---

## 4. Iconography

- All icons are **hand-written inline SVGs**, not an icon library. Consistent conventions:
  - `viewBox` sized to content, typically `0 0 24 24` for larger feature icons, `0 0 12–20` for small UI glyphs (arrows, checks, chevrons).
  - `fill="none"`, `stroke="currentColor"` (or an explicit brand hex for two-tone icons), `strokeWidth` 1.5–2, `strokeLinecap="round"` `strokeLinejoin="round"`.
  - Always `aria-hidden="true"` (icons are decorative; adjacent text carries meaning).
- Reusable local components in `app/page.tsx`: `Check` (circled checkmark), `ArrowRight` (CTA arrow).
- Icon containment: feature icons sit inside a colored circle/rounded-square chip — `size-11`/`size-12` container, `bg-{color}/10` tint, `text-{color}` icon — never bare icons floating in text.

---

## 5. Motion

Motion is intentionally light-touch and **safety-first** (see `prefers-reduced-motion` handling below). Named patterns:

| Pattern | Where | Mechanism |
|---|---|---|
| **Scroll-reveal** | Almost every section, via the `<Reveal>` component | Content renders visible by default (no FOUC / no JS dependency for SEO), then on mount an `IntersectionObserver` (threshold `0.12`) adds `.is-visible`, which plays a defined `reveal-in` keyframe: fade + 8px rise, 600ms, `cubic-bezier(0.22,1,0.36,1)`. Supports a `delay` prop (ms) for staggering siblings — convention is `i * 100` or `i * 120` for grids, `i * 40` for tighter lists like FAQ. |
| **Float** | Hero phone mockup only | `.float-slow` — 6s ease-in-out infinite `translateY` bob (±10px). One float animation on the page at a time — it's a hero signature, not a general card treatment. |
| **Name flick** | `RotatingName` component | `name-flick` keyframe: blur-in + scale + translateY, 420ms, used for rotating hero copy. |
| **Hover lift** | Buttons, cards | `motion-safe:hover:-translate-y-0.5` (buttons) or `-translate-y-1` (cards) + a shadow. Always gated with `motion-safe:` prefix. |
| **Nav shrink/blur** | `SiteNav` | On scroll > 12px, background gains `bg-canvas/85 backdrop-blur-md` + border + shadow via a scroll listener (`useState` + passive scroll listener), not CSS-only — needed because it also toggles border/shadow together. |

**Reduced motion is a first-class constraint, not an afterthought:**
- A global `@media (prefers-reduced-motion: reduce)` block force-collapses all animation/transition durations to `0.01ms`.
- Individual keyframe-driven utilities (`.reveal.is-visible`, `.float-slow`, `.rotating-name-inner`) additionally disable themselves explicitly under reduced-motion.
- The hero's animated phone mockup (`BookingFlowPlayer`) checks `useReducedMotion()` in JS and swaps to a fully static component (`StaticBookingFlow`) rather than just freezing CSS animation — because the animated version is a multi-step scripted sequence, not a CSS loop.
- Every hover-transform utility is prefixed `motion-safe:`.

---

## 6. Accessibility conventions

- **Focus ring**: a single shared class string reused everywhere interactive:
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-racing-green focus-visible:ring-offset-2 focus-visible:ring-offset-{surface}`. The offset color changes per surface (`canvas`, `white`, `racing-green`, `ink`) so the ring never gets clipped or invisible against dark/colored backgrounds.
- **Skip link**: `<a href="#main">Skip to content</a>`, visually hidden until focused (`sr-only focus:not-sr-only`).
- **Scroll offset**: global rule `[id] { scroll-margin-top: 5rem }` so anchor-linked sections don't hide under the sticky nav.
- Decorative SVGs and pseudo-elements: `aria-hidden="true"` throughout.
- Semantic radiogroup for the waitlist form's role toggle (`role="radiogroup"`, `role="radio"`, `aria-checked`).
- FAQ uses native `<details>`/`<summary>` (via `Reveal as="details"`) — no custom accordion JS, gets keyboard/AT support for free.
- Body sets `overflow-x: clip` (not `hidden`) specifically so sticky positioning inside the page still works while guarding against any descendant causing horizontal scroll on mobile.

---

## 7. Component inventory (`components/landing/`)

| Component | Role |
|---|---|
| `SiteNav.tsx` | Sticky header. Client component (scroll listener for blur/shadow state). Contains the brand lockup (`LogoMark` gradient "n" glyph + wordmark) and primary nav + CTA. |
| `Reveal.tsx` | Generic scroll-reveal wrapper, see §5. Accepts `as` for polymorphic rendering (div/article/details/etc). |
| `WaitlistForm.tsx` | Dual-mode (`student` / `instructor`) signup form. Client component, local state, POSTs to `/api/waitlist`, has idle/submitting/success/error states with inline success card replacing the form. |
| `BookingFlowPlayer.tsx` | Orchestrates the animated hero phone demo: picks `BookingFlowAnimated` vs `StaticBookingFlow` based on `useReducedMotion()`, scales a fixed 360×720 canvas responsively via `containerType: inline-size` + CSS `scale(min(1, 100cqi/360px))`. |
| `BookingFlowAnimated.tsx` | Scripted multi-step animated booking sequence rendered inside `PhoneFrame`. |
| `StaticBookingFlow.tsx` | Non-animated fallback of the same flow for reduced-motion users. |
| `PhoneFrame.tsx` | Reusable device-chrome wrapper (360×720 dark rounded frame with a pill-shaped "notch") for any phone-mockup content. |
| `MiniSlotPicker.tsx` | Static booking-slot UI mock used in the "For learners" section — day chips + a list of time slots with availability/selected states. |
| `InstructorCard.tsx` | Marketplace listing card (avatar-color initials, rating, transmission/specialism tags, price, "slots today" badge). Used for instructor-marketplace-style content; supports a `compact` prop. |
| `RotatingName.tsx` | Small animated text-swap component (see "name flick" motion pattern). |

**Note on inline styles vs Tailwind**: several components (`MiniSlotPicker`,
`InstructorCard`, `PhoneFrame`) use `style={{ ... }}` with raw hex values
instead of Tailwind color utilities, particularly for state-dependent color
switching (selected/taken/available). This is a deliberate pattern for
**dynamic, conditionally-computed styles** where building a Tailwind
class-string via template literals would be harder to read — static/known
styling still goes through Tailwind classes. Follow this precedent: reach for
inline `style` only when the value is genuinely computed at render time, not
as a general escape hatch.

---

## 8. Layout patterns used repeatedly

- **Alternating two-column "text + visual" section**: `grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center`, text block wrapped in `<Reveal>`, visual block wrapped in `<Reveal delay={120}>`. This exact shape recurs for "The problem", "For learners", "For instructors". Stagger delay is always **120ms** between the two halves.
- **3-up feature grid**: `grid grid-cols-1 md:grid-cols-3 gap-5`, each card a `<Reveal as="article" delay={i*100}>`. Used for "How it works."
- **Comparison pair**: two `rounded-3xl` cards side by side, one neutral (white/muted) and one "winner" (colored, elevated, glow, larger shadow) — used for the marketplace differentiator and pricing sections. The "winner" card is always visually heavier (color fill vs outline, extra badge, CTA inside the card).
- **Mockup labelling**: any UI mockup that isn't a real live product screen is explicitly labelled — `"Preview"` badge (neutral/dark pill) or `"Concept · not live"` badge (rose pill) pinned to the top-left corner with `absolute -top-3 left-4`. This is a trust/honesty pattern specific to Newdryve's early-access positioning — **always label speculative UI, never let a mockup imply it's shipped.**
- **Dark section rhythm**: the page alternates `canvas → white → canvas → white → ink → canvas → white → racing-green` — dark/colored sections are used as full-bleed emphasis beats (instructors section, final CTA), not as the default.

---

## 9. Content/voice conventions relevant to design

- Numbers and money are always concrete and phrased as facts, not vague marketing ("£4,000 a year", "£29/month", "0% commission" — never "affordable" or "competitive pricing").
- Every claim about scale is deliberately modest/honest ("We're hand-picking a founding cohort," "no inflated numbers, no invented reviews") — this shapes the social-proof section design: no fake testimonials, no fake avatar stacks, no "10,000+ users" counters.
- Single source of truth for repeated values lives in the page module, e.g. `const INSTRUCTOR_PRICE = '£29'` in `app/page.tsx` — don't hardcode the price string a second time if you add a new section referencing it.

---

## 10. Extending this system

When adding a new section or component:
1. Reuse `SectionEyebrow`, `Check`, `ArrowRight` from `app/page.tsx` rather than redefining them locally — if a new page needs them, extract to `components/landing/`.
2. Keep the `py-16 md:py-24` / `max-w-6xl` / `px-5` container rhythm.
3. Pick **one** brand color as the section's accent (green = trust/protection, rose = action/energy) — don't blend both as equal-weight CTAs in one section.
4. Any new heading uses `font-display font-semibold` with a `clamp()` size and negative tracking, matching the closest tier in §2.2.
5. Any new interactive element gets the shared focus-ring string with the correct `ring-offset-*` for its background.
6. Any new hover/entrance animation must be wrapped in `motion-safe:` or check `prefers-reduced-motion` in JS if it's more than a CSS transition.
7. If it's a mockup/demo of unshipped product UI, label it ("Preview" / "Concept · not live").
