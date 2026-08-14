import { SITE_URL, BRAND, PRICING, APP } from '../config/site';

export type FaqItem = { q: string; a: string };

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}#organization`,
  name: BRAND.name,
  legalName: BRAND.legalName,
  url: SITE_URL,
  logo: `${SITE_URL}/og.png`,
  email: BRAND.email,
  description:
    'Newdryve is a marketplace connecting UK learner drivers with verified, ADI-qualified, DBS-checked driving instructors. Live in Norwich.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: BRAND.city,
    addressRegion: BRAND.region,
    addressCountry: BRAND.country,
  },
  areaServed: { '@type': 'City', name: BRAND.city },
  sameAs: [BRAND.instagram, APP.android.url].filter(Boolean),
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}#website`,
  url: SITE_URL,
  name: BRAND.name,
  inLanguage: 'en-GB',
  publisher: { '@id': `${SITE_URL}#organization` },
};

/**
 * Service schema for the learner side. Deliberately carries no aggregateRating:
 * Newdryve has no review corpus yet, and inventing one would be fabricated
 * social proof (and a Google structured-data violation).
 */
export const learnerServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${SITE_URL}#learner-service`,
  name: 'Driving lesson booking in Norwich',
  serviceType: 'Driving lesson booking',
  provider: { '@id': `${SITE_URL}#organization` },
  areaServed: {
    '@type': 'City',
    name: BRAND.city,
    containedInPlace: { '@type': 'AdministrativeArea', name: BRAND.region },
  },
  audience: { '@type': 'Audience', audienceType: 'Learner drivers' },
  description:
    'Find a verified, ADI-qualified and DBS-checked driving instructor in Norwich, see real availability and book a lesson in under 60 seconds. Newdryve charges learners nothing.',
};

/** Software schema for the instructor side, priced at the real £29/month. */
export const instructorAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}#instructor-app`,
  name: 'Newdryve for instructors',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Android, iOS, Web',
  url: `${SITE_URL}/instructors`,
  publisher: { '@id': `${SITE_URL}#organization` },
  description:
    'Newdryve brings driving instructors new learners and applies a 50% cancellation fee when a learner cancels within 24 hours. Newdryve takes 0% commission.',
  offers: {
    '@type': 'Offer',
    price: '29.00',
    priceCurrency: 'GBP',
    category: 'subscription',
    description: `${PRICING.monthlyWithPeriod} flat. ${PRICING.commission} Newdryve commission. ${PRICING.cancelAnytime}.`,
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '29.00',
      priceCurrency: 'GBP',
      unitCode: 'MON',
      billingDuration: 1,
    },
  },
};

export function faqSchema(items: readonly FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: new URL(entry.path, SITE_URL).href,
    })),
  };
}
