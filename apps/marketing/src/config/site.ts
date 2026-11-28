/**
 * Single source of truth for every factual claim the marketing site makes.
 *
 * Rule for this file: nothing goes in here that cannot be verified. No invented
 * ratings, review counts, testimonials or partner logos. If a fact is not
 * confirmed yet, leave it null and the UI will omit that block entirely rather
 * than render a placeholder that reads as a real claim.
 */

export const SITE_URL = (
  import.meta.env.PUBLIC_SITE_URL || 'https://newdryve.com'
).replace(/\/$/, '');

export const BRAND = {
  name: 'Newdryve',
  legalName: 'NEWDRYVE LTD',
  city: 'Norwich',
  region: 'Norfolk',
  country: 'GB',
  email: 'hello@newdryve.com',
  supportEmail: 'support@newdryve.com',
  instagram: 'https://instagram.com/newdryve',
} as const;

/**
 * Instructor subscription pricing. £29/month is the ONLY Newdryve fee that
 * exists. Referenced everywhere rather than hardcoded, so it can never drift
 * between pages.
 */
export const PRICING = {
  monthly: '£29',
  monthlyWithPeriod: '£29/month',
  commission: '0%',
  cancelAnytime: 'Cancel anytime',
  billingCancellation:
    'Cancel anytime. Your membership stays active until the end of the current billing period, which is non-refundable.',
  /** Share of the lesson fee a late-cancelling learner is charged. */
  lateCancellationShare: '50%',
  /**
   * Cancellation window that triggers the automatic charge. 24 hours, matching
   * clause 11 of the Terms. Inside the final 30 minutes the full price applies
   * (finalCancellationShare / finalCancellationWindow), as in the app since 23 Sep 2026. The previous Next site said 48 hours in its copy
   * and FAQ structured data, which contradicted the binding terms.
   */
  lateCancellationWindow: '24 hours',
  /** Share charged when a learner cancels inside the final window. Matches the app's policy r3. */
  finalCancellationShare: '100%',
  /** The final window: inside this, a learner cancellation costs the full lesson price. */
  finalCancellationWindow: '30 minutes',
} as const;

/**
 * App availability. Both stores are live.
 *
 * android: `https://play.google.com/store/apps/details?id=com.newdryve.app`.
 * ios: approved and live on the UK App Store.
 *
 * web: app.newdryve.com is no longer the web app. It is a download page with
 * App Store and Google Play buttons. It stays the no-JavaScript fallback for
 * every "Get the app" button and the target of the desktop QR code.
 */
export const APP = {
  web: {
    url: 'https://app.newdryve.com/',
  },
  android: {
    live: true,
    url: 'https://play.google.com/store/apps/details?id=com.newdryve.app',
  },
  ios: {
    live: true,
    url: 'https://apps.apple.com/gb/app/newdryve/id6795593802',
  },
} as const;

/**
 * Real founding instructors only.
 *
 * UNRESOLVED, see the handover notes: gokhandrive.co.uk states coverage of
 * "Enfield, Wood Green, North London", which contradicts the Norwich beachhead
 * positioning used across the site. No area is claimed here until that is
 * confirmed, and `quote` stays null because no statement by him was found on
 * his site. Nothing about him is invented.
 *
 * Set `show: false` to remove the section entirely.
 *
 * Redesign (November 2026): Jed asked for no named founding instructor on the
 * site, so this is off and nothing renders it. Do not reintroduce a name or
 * the instructor's website without his say-so.
 */
export const FOUNDING_INSTRUCTORS = {
  show: false,
  people: [
    {
      name: 'Gokhan Guckiran',
      /** Confirm before publishing. Rendered only when non-null. */
      area: null as string | null,
      website: 'https://gokhandrive.co.uk/',
      /** A real quote in his own words. Never write one on his behalf. */
      quote: null as string | null,
    },
  ],
} as const;

export const NAV_LINKS = [
  { href: '/driving-lessons/norwich', label: 'Lessons' },
  { href: '/test-centres', label: 'Test centres' },
  { href: '/guides/driving-lesson-cost', label: 'Costs' },
  { href: '/instructors', label: 'For instructors' },
] as const;

export const INSTRUCTOR_NAV_LINKS = [
  { href: '/instructors/features', label: 'Features' },
  { href: '/instructors#how-it-works', label: 'How it works' },
  { href: '/instructors#pricing', label: 'Pricing' },
  { href: '/instructors#faq', label: 'FAQ' },
  { href: '/', label: 'For learners' },
] as const;

/**
 * Postcode coverage for the home page check.
 *
 * PLACEHOLDER, NOT REAL COVERAGE DATA. Real coverage lives in the product
 * database (`instructors.service_postcodes`, plus each instructor's coverage
 * area), and there is no public endpoint that answers "does anyone cover NR2?"
 * yet. Until there is, this list mirrors only what the learner FAQ already
 * claims: Norwich and the named areas around it (Thorpe St Andrew and
 * Sprowston NR7, Hellesdon NR6, Costessey NR5 and NR8, Wymondham NR18).
 * Replace it with a lookup against instructor data before relying on it.
 */
export const COVERAGE = {
  outwardCodes: ['NR1', 'NR2', 'NR3', 'NR4', 'NR5', 'NR6', 'NR7', 'NR8', 'NR18'],
} as const;

/**
 * Backers strip on the home page. Text only, no logos.
 *
 * UNVERIFIED: these names came from an earlier mockup. Confirm every one is
 * accurate and cleared for public use before this ships, or set `show: false`.
 */
export const BACKERS = {
  show: true,
  backedBy: ['Kickstart Global', 'Google for Startups', 'UEA Enterprise Fund'],
  teachingOnNewdryve: ['Chilled Driving School', '17+ Driving School'],
} as const;

/** Footer link columns. Town, test-centre and guide links are kept for SEO. */
export const FOOTER_COLUMNS = [
  {
    title: 'Lessons by town',
    links: [
      { href: '/driving-lessons/norwich', label: 'Norwich' },
      { href: '/driving-lessons/wymondham', label: 'Wymondham' },
      { href: '/driving-lessons/dereham', label: 'Dereham' },
      { href: '/driving-lessons/attleborough', label: 'Attleborough' },
      { href: '/driving-lessons/diss', label: 'Diss' },
    ],
  },
  {
    title: 'Test centres',
    links: [
      { href: '/test-centres/norwich-peachman-way', label: 'Peachman Way' },
      { href: '/test-centres/norwich-jupiter-road', label: 'Jupiter Road' },
      { href: '/test-centres', label: 'All test centres near Norwich' },
    ],
  },
  {
    title: 'Guides',
    links: [
      { href: '/guides/driving-lesson-cost', label: 'What lessons cost' },
      { href: '/guides/how-to-find-a-driving-instructor', label: 'Finding a good instructor' },
      { href: '/guides/how-many-lessons-to-pass', label: 'How many lessons to pass' },
      { href: '/guides/manual-vs-automatic', label: 'Manual or automatic' },
      { href: '/guides/how-to-book-driving-test', label: 'Booking your test' },
      { href: '/guides/driving-test-waiting-times', label: 'Test waiting times' },
    ],
  },
  {
    title: 'Newdryve',
    links: [
      { href: '/instructors', label: 'For instructors' },
      { href: 'https://instagram.com/newdryve', label: 'Instagram', external: true },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/datadeletion', label: 'Delete account' },
    ],
  },
] as const;
