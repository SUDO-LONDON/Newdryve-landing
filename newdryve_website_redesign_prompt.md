# Newdryve — Landing Page Redesign Build Prompt
## For Claude Code (Next.js + Tailwind)

## Goal
Rebuild the Newdryve marketing landing page so it looks like a modern, funded startup — not a student project and not a dense WordPress competitor site. It must clearly out-class the two incumbents (TotalDrive and MyDriveTime), both of which are cluttered, feature-list-heavy, instructor-only diary tools. Newdryve's edge is that it is a TWO-SIDED MARKETPLACE with automatic cancellation protection — lean into that on every screen.

Keep the existing Next.js stack. Improve the look, layout, motion, and structure. Do NOT break the existing email capture forms or their submission logic.

---

## Positioning (the strategic core — read before designing)

The two competitors (TotalDrive, MyDriveTime) are admin/diary software. Their whole pitch is "manage the students you already have." NEITHER brings instructors new students, and NEITHER enforces cancellations automatically (they just let you manually mark a lesson as chargeable).

Newdryve's two differentiators must dominate the page:
1. **Marketplace** — learners discover and come to the instructor. Newdryve fills empty diary slots with NEW students. Competitors cannot do this.
2. **Automatic cancellation protection** — card on file, auto-charged 50% on late cancellation, paid straight to the instructor. Competitors only offer manual cancellation recording.

Every section should reinforce: "The others help you manage students you already have. Newdryve brings you new ones and protects your income."

---

## Brand & Visual Direction

**Colours (from logo):**
- Primary: Dark teal `#2C5F5F`
- Accent: Bright pink/magenta `#EC4E8B`
- Ink (text): `#0A0A14`
- Soft background: `#F6F8F8` (very light teal-grey)
- White: `#FFFFFF`

**Aesthetic:** Clean, confident, fintech-grade (think Monzo / Wise / Linear). Generous whitespace. Large type. Restrained use of pink as an accent only — never large pink fills except one or two deliberate moments. Rounded corners (16-24px), soft shadows, subtle depth.

**Typography:**
- Display/headings: a strong modern serif OR geometric sans — pick ONE distinctive heading font (e.g. a serif like "Fraunces" or sans like "General Sans" / "Satoshi"). Headings should feel editorial and premium.
- Body: clean neutral sans (Inter or system).
- Big hero headline, tight line-height, confident.

**Motion:**
- Subtle scroll-reveal (fade + 8px rise) on sections as they enter viewport.
- A gentle parallax or float on the phone mockup in the hero.
- Hover states on cards (lift + shadow). Nothing gimmicky.
- Respect prefers-reduced-motion.

---

## Page Structure (top to bottom)

### 1. Sticky nav
- Left: Newdryve wordmark + logo mark.
- Centre: anchors — How it works · For instructors · For learners · FAQ.
- Right: primary button "Apply for early access" (pink).
- Transparent over hero, gains a white background + subtle shadow on scroll.

### 2. Hero (split layout)
- Left column:
  - Small eyebrow pill: "Norwich · Early access"
  - Huge headline: "Driving lessons, finally sorted."
  - Subhead: "Newdryve connects Norwich learners with verified ADI instructors — and automatically protects instructors from last-minute cancellations. Book in 60 seconds."
  - Two CTAs: "Join the Norwich waitlist" (pink, primary) + "I'm an instructor" (outline).
  - Tiny trust line under buttons: "0% commission · Free until your first booking"
- Right column:
  - A polished phone mockup showing the instructor-discovery screen (reuse the existing mock content: Sarah Mitchell, James Okafor, Priya Sharma). Float it gently. Add a soft teal glow behind it.
- Mark any mock UI clearly but subtly with a small "Preview" tag so it's honest without screaming "not live."

### 3. Trust strip
- A slim horizontal strip: "DBS-checked instructors · ADI-qualified · Card-protected bookings · Built in Norwich".
- Greyscale, understated. (Competitors lean hard on partner logos — until you have them, use trust attributes instead of fake logos.)

### 4. The problem (instructor-facing, emotional)
- Big statement: "Instructors lose over £4,000 a year to last-minute cancellations."
- Short supporting paragraph. One bold stat block with the £4,000 figure dominant.
- Visual: a simple, elegant illustration or a "cancelled" lesson card with a red strike.

### 5. The solution — How it works (3 steps)
- Three clean cards with icons in teal circles: Book → Secure (card on file) → Protected (auto-charge if cancelled, paid to instructor).
- The third card gets the pink accent — it's the payoff.

### 6. The marketplace differentiator (THE key section)
- Headline: "Other apps manage your diary. Newdryve fills it."
- Two-column contrast, but framed positively around Newdryve.
- Left: "Diary software" (TotalDrive, MyDriveTime style) — manages students you already have.
- Right (highlighted, teal bg): "Newdryve" — a marketplace that sends you NEW learners, plus automatic cancellation payout, plus 0% commission.
- This is where you win. Make it the visual centrepiece.

### 7. For learners section
- Flip the audience. Headline: "Find an instructor. See real availability. Book instantly."
- Three benefits: verified instructors, real-time availability, track your hours to test.
- Phone mockup of the learner booking flow.
- CTA: "Join the Norwich waitlist".

### 8. For instructors section
- Headline: "Built for instructors who'd rather teach than chase payments."
- Benefit list: auto cancellation charge, set your own availability, keep your pricing, 0% commission forever, free until first booking, then flat monthly fee.
- IMPORTANT: pricing must be consistent. Use ONE figure site-wide. (Decide £29 or £35 and use it everywhere — do not mix. Flag this to me if both appear.)
- CTA: "Apply as a founding instructor".

### 9. Pricing (single clean block)
- For learners: Free. Always. You pay your instructor directly.
- For instructors: Free until first booking, then [ONE consistent price]/month. 0% commission. Cancel anytime.
- Keep it to two simple cards. Competitors use cluttered tiered tables — yours should feel calm and obvious.

### 10. Social proof / founding cohort
- Since you don't yet have hundreds of testimonials, use honesty as a weapon: "We're hand-picking our founding instructors in Norwich." 
- If/when you have the 30-year ADI champion quote, feature it here as a single strong testimonial card.
- Do NOT fabricate review counts or fake testimonials.

### 11. FAQ
- Reuse existing FAQ content, restyle as clean accordions.

### 12. Final CTA band
- Full-width teal band. "Help us build it." Two buttons (learner / instructor).

### 13. Footer
- Wordmark, nav links, Instagram.
- MUST include: Privacy Policy and Terms links. (These are legally required and currently missing — create placeholder routes /privacy and /terms and link them. Tell me you've stubbed them so I can write the real content.)

---

## Hard Requirements / Guardrails
- Do NOT break existing email capture forms or their POST logic. Restyle only.
- Pricing must be ONE consistent number across the whole site. If you find both £29 and £35 in the codebase, stop and ask which to use.
- Add /privacy and /terms route stubs and link them in the footer.
- Mobile-first. Must look excellent on a phone (most ADIs and learners will view on mobile).
- Accessibility: WCAG AA contrast, 44px min tap targets, semantic HTML, alt text, focus states, prefers-reduced-motion.
- No fabricated social proof (no fake review counts, no invented testimonials, no partner logos you don't have).
- Mark any non-live mock UI with a small, tasteful "Preview" indicator.
- Keep bundle lean — no heavy animation libraries if CSS/Framer Motion will do.
- SEO: keep existing meta tags, geo tags, and structured data; improve where relevant.

## Build Order
1. Set up the design tokens (colours, fonts, spacing, radius, shadows) first.
2. Build the nav + hero — get the look right before proceeding.
3. Then build sections top to bottom.
4. Wire scroll-reveal motion last.
5. QA on mobile + desktop, check contrast and tap targets, then report what you changed.

## Success Criteria
- Looks like a funded startup, not a student project or a WordPress competitor.
- The marketplace + cancellation-protection differentiators are unmissable.
- Speaks to BOTH learners and instructors (competitors speak only to instructors).
- Consistent pricing, working forms, privacy/terms linked.
- Fast, responsive, accessible.
