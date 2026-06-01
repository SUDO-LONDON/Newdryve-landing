const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://newdryve.com";

export const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}#organization`,
  name: "Newdryve",
  url: SITE_URL,
  logo: `${SITE_URL}/icon`,
  description:
    "Newdryve is an early-access platform being built to connect learner drivers in Norwich with verified, ADI-qualified instructors.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Norwich",
    addressRegion: "Norfolk",
    addressCountry: "GB",
  },
  areaServed: {
    "@type": "City",
    name: "Norwich",
  },
};

export const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  url: SITE_URL,
  name: "Newdryve",
  description:
    "Newdryve. Early access for learner drivers and instructors in Norwich. Apply to join the first cohort.",
  inLanguage: "en-GB",
  publisher: { "@id": `${SITE_URL}#organization` },
};

export const FAQ_ITEMS = [
  {
    q: "Is Newdryve available to use now?",
    a: "Not yet. Newdryve is in early access. We're building it now and inviting a first cohort of learners and instructors in Norwich. Apply on this page and we'll be in touch as spots open up.",
  },
  {
    q: "What is Newdryve going to do?",
    a: "Newdryve will let you find a verified, ADI-qualified driving instructor in Norwich, see their real availability, and book a lesson without the back-and-forth of missed calls and voicemails, paying by card, bank transfer, or cash.",
  },
  {
    q: "I'm a learner. What do I get from joining early access?",
    a: "Early access learners are first in line when we open bookings and get to help shape the app. Newdryve never adds a booking fee or platform charge for learners: you pay your instructor directly for the lesson, nothing more.",
  },
  {
    q: "I'm a driving instructor. Why should I apply?",
    a: "We're recruiting a small founding group of ADI-qualified instructors in and around Norwich. You'll get a branded booking experience, set your own availability and pricing, and keep 100% of every lesson. Newdryve takes 0% commission. You pay nothing until your first booking, then a flat monthly fee.",
  },
  {
    q: "How much does Newdryve cost?",
    a: "For instructors: 0% commission on every booking, forever. You pay nothing until your first booking, then £35/month. No per-booking cuts, no hidden fees. The cancellation protection alone recovers more than that in the first month for most instructors. For learners: nothing. You pay your instructor directly for the lesson.",
  },
  {
    q: "When will Newdryve launch?",
    a: "We're launching in Norwich in summer 2026. Apply now to be in the founding cohort — founding instructors get the best rate and first access to our learner base.",
  },
  {
    q: "Where will Newdryve operate?",
    a: "We're starting in Norwich and the surrounding Norfolk area: Thorpe St Andrew, Hellesdon, Wymondham, Sprowston, Costessey and nearby. We'll expand to other UK cities once Norwich is running smoothly.",
  },
  {
    q: "How will payment work?",
    a: "We plan to support card, bank transfer (Faster Payments / BACS) and cash on arrival, so learners and instructors can pick whichever option suits them.",
  },
];

export const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: {
      "@type": "Answer",
      text: a,
    },
  })),
};

export const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
  ],
};

export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}
