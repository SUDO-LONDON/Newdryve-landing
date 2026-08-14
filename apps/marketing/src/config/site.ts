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
   * clause 11 of the Terms. The previous Next site said 48 hours in its copy
   * and FAQ structured data, which contradicted the binding terms.
   */
  lateCancellationWindow: '24 hours',
} as const;

/**
 * App availability.
 *
 * android: verified live. `https://play.google.com/store/apps/details?id=com.newdryve.app`
 * returns HTTP 200 with og:title "Newdryve - Apps on Google Play", while a
 * non-existent package id on the same host returns 404.
 *
 * ios: reported as in App Store review. No public listing URL exists yet, so
 * the UI shows "coming soon" text and deliberately renders no link. Fill in
 * `url` the moment it is approved and the badge appears automatically.
 */
export const APP = {
  android: {
    live: true,
    url: 'https://play.google.com/store/apps/details?id=com.newdryve.app',
  },
  ios: {
    live: false,
    url: null as string | null,
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
 */
export const FOUNDING_INSTRUCTORS = {
  show: true,
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
  { href: '/#faq', label: 'FAQ' },
] as const;

export const INSTRUCTOR_NAV_LINKS = [
  { href: '/instructors#how-it-works', label: 'How it works' },
  { href: '/instructors#pricing', label: 'Pricing' },
  { href: '/instructors#faq', label: 'FAQ' },
  { href: '/', label: 'For learners' },
] as const;
