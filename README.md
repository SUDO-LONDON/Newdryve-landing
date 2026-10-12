# Newdryve Landing

One Railway service that serves `newdryve.com` from two apps behind a small
router (`scripts/railway-start-landing.cjs`):

- **Astro** (`apps/marketing`): the public marketing site, legal and account
  pages, `/instructors/apply` and its `/api/*` form endpoints. See
  `apps/marketing/README.md`.
- **Next.js 16** (this directory): the founder portal (`/ops`), the
  organisation portal (`/organisations`), the pitch deck (`/thedeck`) and
  instructor onboarding (`/instructor/*`, `/connect/*`, `/instructors/activate`,
  `/api/instructor/*`).

The router sends those Next prefixes (and `/_next/*`) to Next and every other
path to Astro, so a Next page outside those prefixes is never served. The
Fastify API is not proxied: it lives at its own origin (`api.newdryve.com`).

## Quick start

```bash
npm ci && (cd apps/marketing && npm ci)
cp .env.example .env.local   # fill in what you need
npm run dev                  # Next only, http://localhost:3000
```

To run both apps the way production does:

```bash
npm run build && (cd apps/marketing && npm run build)
node scripts/railway-start-landing.cjs   # router on $PORT (default 3000)
```

## Scripts

| Command         | Purpose                                  |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Next dev server (Turbopack)              |
| `npm run build` | Next production build                    |
| `npm run start` | Next alone (`next start`); production runs the router script instead |
| `npm run lint`  | ESLint                                   |
| `npm run railway:deploy` | Set ops Supabase env vars on Railway from `.env.local`, then deploy |

## Environment variables

`.env.example` documents every variable. The ones the router's apps cannot
start sensibly without:

| Variable | Used by |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for redirects and links |
| `NEXT_PUBLIC_APP_URL` | "Open Newdryve" on the instructor setup page (default `https://app.newdryve.com`) |
| `BACKEND_ORIGIN` | Live API origin for instructor onboarding (Next) and applications (Astro) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | `/ops` (its own Supabase project) |
| `OPS_FOUNDER_ALLOWLIST`, `OPS_SESSION_SECRET` | `/ops` sign-in |
| `NEWDRYVE_API_ORIGIN`, `NEWDRYVE_API_OPS_SECRET` | `/ops` instructor and organisation actions |

## Deployment

The Railway service must build both apps and start
`node scripts/railway-start-landing.cjs`; those commands live in the Railway
service settings, not in this repo. `npm start` alone would serve only the
Next prefixes and 404 the marketing site.
For Railway, `npm run railway:deploy` reads `.env.local`, sets the ops Supabase
variables on the linked Railway service, and runs `railway up`. Use
`npm run railway:deploy -- -SkipDeploy` to update variables without deploying.
Optional parameters: `-Environment`, `-Service`, and `-Project`.

## License

© SUDO-LONDON. All rights reserved.
