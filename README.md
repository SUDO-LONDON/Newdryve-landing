# Newdryve Landing

Marketing site for **Newdryve**, the UK driving-lesson booking platform. Built with Next.js 16 (Turbopack), Tailwind v4, and an animated phone-mockup hero powered by Remotion's `@remotion/player`.

The dashboard and authenticated app live in a separate repo and are linked from the landing via the `NEXT_PUBLIC_APP_URL` env var.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS v4** (token-driven, single `globals.css`)
- **Remotion 4 + `@remotion/player`**: embedded looping 3-scene phone animation (Discover → Slot Picker → Confirmation) with a `prefers-reduced-motion` static fallback
- **TypeScript**, **ESLint** (next/core-web-vitals + typescript)

## Quick start

```bash
npm install
cp .env.example .env.local   # set the URLs you want for production
npm run dev                  # http://localhost:3000
```

## Scripts

| Command         | Purpose                                  |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Dev server (Turbopack)                   |
| `npm run build` | Production build                         |
| `npm run start` | Serve the production build               |
| `npm run lint`  | ESLint                                   |

## Environment variables

| Variable                 | Required | Default                       | Used by                                              |
| ------------------------ | -------- | ----------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`   | yes (prod) | `https://newdryve.com`      | Metadata, canonicals, OG tags, sitemap, robots, JSON-LD |
| `NEXT_PUBLIC_APP_URL`    | yes (prod) | `https://app.newdryve.com`  | "Open Dashboard" and "Log in" CTAs                    |
| `BACKEND_ORIGIN`         | yes (if sharing domain with API) | unset | Rewrites `/v1/*`, `/healthz`, and `/readyz` to the existing Fastify backend |

## Layout

```
app/
  layout.tsx              # Root layout, DM Sans font, full Metadata + Viewport config
  page.tsx                # The landing page itself
  globals.css             # Tailwind v4 + brand tokens (Racing Green / Deep Rose / Canvas / Ink)
  robots.ts               # → /robots.txt
  sitemap.ts              # → /sitemap.xml
  manifest.ts             # → /manifest.webmanifest
  opengraph-image.tsx     # Dynamic 1200×630 OG image (Edge)
  icon.tsx                # 32×32 favicon
  apple-icon.tsx          # 180×180 Apple touch icon
components/landing/
  PhoneFrame.tsx          # Phone bezel wrapper
  BookingFlowComposition.tsx  # Remotion composition (3 scenes, 270 frames)
  BookingFlowPlayer.tsx   # 'use client' Player wrapper + reduced-motion fallback
  StaticBookingFlow.tsx   # Static frame shown when prefers-reduced-motion: reduce
  InstructorCard.tsx      # Reusable instructor card (also used inside Remotion)
  MiniSlotPicker.tsx      # Static slot picker used in feature illustration
lib/
  instructors.ts          # Typed demo data (Sarah, James, Priya, Tom + SLOTS)
  useReducedMotion.ts     # matchMedia hook
  structured-data.tsx     # JSON-LD payloads (Organization, DrivingSchool, FAQPage, ItemList, ...)
  env.ts                  # NEXT_PUBLIC_APP_URL → DASHBOARD_URL / LOGIN_URL
```

## SEO

The page ships:

- **Metadata**: title template, canonical, full Open Graph + Twitter cards, robots directives, `geo.*` meta, `lang="en-GB"`, dual light/dark `themeColor`.
- **Routes**: `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/opengraph-image`, `/icon`, `/apple-icon`.
- **Structured data** (7 schemas injected as `application/ld+json`): `Organization`, `WebSite`, `DrivingSchool` (with full `OfferCatalog`, `OpeningHoursSpecification`, `aggregateRating`, `paymentAccepted: [Credit Card, Debit Card, Bank Transfer, Cash]`), `MobileApplication`, `FAQPage` (7 Q&As, eligible for rich results), `BreadcrumbList`, `ItemList` of instructors.
- **AI-search visibility**: robots explicitly allows GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Google-Extended, Claude-Web, anthropic-ai.

## Accessibility

- Skip link → `<main id="main">` landmark
- `focus-visible` ring on every interactive element
- `motion-safe:` prefix on every transform / transition
- `prefers-reduced-motion` swaps the Remotion animation for a static frame
- Curly typography, `tabular-nums` on numbers, `text-balance` on headings
- All decorative SVGs marked `aria-hidden="true"`

## Deployment

The site is a standard Next.js App Router project. Deploy anywhere Next.js 16 runs (Vercel recommended). Set the two `NEXT_PUBLIC_*` env vars on the deploy target.

If `newdryve.com` should serve this landing page while the existing backend remains unchanged, point `newdryve.com` at this Next.js app and set `BACKEND_ORIGIN` to the backend service's public origin, for example the Railway-generated backend domain. Next.js will proxy `/v1/*`, `/healthz`, and `/readyz` to that backend so existing API and webhook paths continue to work.

## License

© SUDO-LONDON. All rights reserved.
