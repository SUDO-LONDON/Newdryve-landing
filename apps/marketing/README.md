# Newdryve marketing site (Astro)

The public marketing site: learner homepage, instructor page, and the legal and
account pages. Built with Astro 5, Tailwind v4 and the Node adapter.

The `/ops` founder portal stays on the existing Next.js app at the repo root.
The two are deployed as separate services (see Deployment).

## Quick start

```bash
npm install
cp .env.example .env      # Astro reads .env automatically
npm run dev               # http://localhost:4321
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build to `dist/` |
| `npm run start` | Serve the build (`node ./dist/server/entry.mjs`) |
| `npm run check` | Astro + TypeScript diagnostics |
| `node scripts/generate-og.mjs` | Regenerate `public/og.png` |

## Rendering model

`output: 'static'`, so every marketing page is prerendered to plain HTML at
build time and ships **zero external JavaScript**. The small amount of behaviour
on the page (sticky nav, mobile menu, form submit, scroll reveal) is inlined
into the HTML by Astro.

Two routes opt out with `export const prerender = false` because they hold
server-only secrets:

- `src/pages/api/waitlist.ts`
- `src/pages/api/data-deletion.ts`

`/reset-password` is the one page with a JS bundle, because it talks to Supabase
in the browser. It is `noindex`.

## Routes

| Route | Notes |
| --- | --- |
| `/` | Learner homepage |
| `/instructors` | Instructor page |
| `/privacy` | Real policy text, ported verbatim. Indexed. |
| `/terms` | Real T&Cs, ported verbatim. `noindex`, preserving prior behaviour. |
| `/datadeletion` | Deletion request form |
| `/reset-password` | Product Supabase password reset. `noindex`. |
| `/instructors/apply` | Instructor application form. Certificates upload straight to Supabase Storage. |
| `/api/waitlist` | `POST {email, role, postcode, name, notes}` |
| `/api/data-deletion` | `POST {firstName, lastName, email, phone}` |
| `/api/instructor-apply` | `POST` application → proxies to `POST /v1/instructors/apply` |

### Instructor applications

`/instructors/apply` replaces the founder's local daemon as the way an
instructor account is created. The applicant chooses their own password, the
account is created immediately but cannot be signed into, and a founder approves
it in `/ops`.

It needs one env var, which is **not** in `.env.example` because that file is
gitignored:

| Var | Value |
| --- | --- |
| `BACKEND_ORIGIN` | Live Fastify API origin, e.g. `https://api.newdryve.com` |

Unset, the form returns a 503 with a "temporarily unavailable" message rather
than failing silently. The ADI/DBS certificates never pass through this service:
the API returns short-lived signed upload URLs and the browser `PUT`s each file
directly to a private Supabase Storage bucket.

## Content and factual claims

`src/config/site.ts` is the single source of truth for every factual claim:
pricing, app availability and founding instructors. The rule for that file is
that nothing goes in it that cannot be verified. Unconfirmed facts stay `null`
and the UI omits the block rather than rendering a placeholder that reads as a
real claim.

- Instructor pricing is `£29/month`, referenced from `PRICING` everywhere so it
  cannot drift between pages.
- The late-cancellation window is **24 hours**, matching clause 11 of the Terms.
- No fabricated social proof. App screenshots carry a "Preview" label and a
  caption disclosing that the instructor profiles shown are sample data.

## Deployment (Railway, two services)

The marketing site and the ops portal are separate services:

| Service | Root | Serves |
| --- | --- | --- |
| marketing | `apps/marketing` | `newdryve.com` |
| ops | repo root (Next.js) | `ops.newdryve.com` |

Marketing service settings:

- Build: `npm ci && npm run build`
- Start: `npm run start`
- The adapter honours `HOST` and `PORT`; Railway sets `PORT` automatically.

Required before cutover:

1. Set the env vars from `.env.example` on the marketing service.
2. Point `ops.newdryve.com` at the existing Next service and update the Supabase
   auth redirect URLs plus `OPS_BASE_URL` to that host. The old Next middleware
   handled the `?code=` OTP callback at `/`, which the Astro site does not.
3. Add a redirect from `newdryve.com/ops/*` to `ops.newdryve.com/*` so existing
   founder bookmarks keep working.

The old Next app also proxied `/v1/*`, `/healthz` and `/readyz` to the Fastify
backend via `BACKEND_ORIGIN`. If `newdryve.com` still needs to serve those
paths, that rewrite has to be reproduced at the edge or on the ops service.
