import { INSTRUCTORS } from "./instructors";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://newdryve.com";

export const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}#organization`,
  name: "Newdryve",
  url: SITE_URL,
  logo: `${SITE_URL}/icon`,
  description:
    "Newdryve is a booking platform connecting UK learner drivers with verified, DBS-checked driving instructors.",
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
  sameAs: [
    "https://apps.apple.com/",
  ],
};

export const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  url: SITE_URL,
  name: "Newdryve",
  description:
    "Book driving lessons with DBS-verified instructors in Norwich. Real-time availability for the next 14 days.",
  inLanguage: "en-GB",
  publisher: { "@id": `${SITE_URL}#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const LOCAL_BUSINESS_JSONLD = {
  "@context": "https://schema.org",
  "@type": "DrivingSchool",
  "@id": `${SITE_URL}#localbusiness`,
  name: "Newdryve Driving Lessons — Norwich",
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image`,
  description:
    "Book driving lessons in Norwich with verified, DBS-checked instructors. Manual and automatic transmission. Pay by card, bank transfer, or cash.",
  priceRange: "£35–£40 per hour",
  telephone: "+44-0000-000000",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Norwich City Centre",
    addressLocality: "Norwich",
    addressRegion: "Norfolk",
    postalCode: "NR1",
    addressCountry: "GB",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 52.6309,
    longitude: 1.2974,
  },
  areaServed: [
    { "@type": "City", name: "Norwich" },
    { "@type": "Place", name: "Thorpe St Andrew" },
    { "@type": "Place", name: "Hellesdon" },
    { "@type": "Place", name: "Wymondham" },
    { "@type": "Place", name: "Sprowston" },
    { "@type": "Place", name: "Costessey" },
    { "@type": "Place", name: "Earlham" },
  ],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "07:00",
      closes: "21:00",
    },
  ],
  paymentAccepted: ["Credit Card", "Debit Card", "Bank Transfer", "Cash"],
  currenciesAccepted: "GBP",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.85",
    reviewCount: "481",
    bestRating: "5",
    worstRating: "1",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Driving lesson types",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "1-hour driving lesson",
          description: "Single one-hour driving lesson with a DBS-verified instructor.",
        },
        priceSpecification: {
          "@type": "PriceSpecification",
          price: "38",
          priceCurrency: "GBP",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "2-hour driving lesson",
          description: "Two-hour driving lesson — best for real progress.",
        },
        priceSpecification: {
          "@type": "PriceSpecification",
          price: "70",
          priceCurrency: "GBP",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Mock driving test",
          description: "105-minute mock test that simulates the DVSA practical exam.",
        },
        priceSpecification: {
          "@type": "PriceSpecification",
          price: "72",
          priceCurrency: "GBP",
        },
      },
    ],
  },
};

export const MOBILE_APP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: "Newdryve",
  operatingSystem: "iOS",
  applicationCategory: "TravelApplication",
  applicationSubCategory: "Driving lessons booking",
  url: SITE_URL,
  description:
    "Book driving lessons with verified instructors in Norwich. Real-time availability and flexible payment options.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "GBP",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.85",
    reviewCount: "481",
    bestRating: "5",
    worstRating: "1",
  },
};

export const FAQ_ITEMS = [
  {
    q: "How fast can I book a driving lesson on Newdryve?",
    a: "Most learners complete a booking in under 60 seconds. Pick an instructor, choose a slot from real-time availability, confirm your details, and pay your way — card, bank transfer, or cash.",
  },
  {
    q: "Are Newdryve instructors DBS verified?",
    a: "Yes. Every instructor on Newdryve is DBS checked, qualified (ADI), and independently rated by previous students. Verification badges are shown on every instructor profile.",
  },
  {
    q: "How much does a driving lesson in Norwich cost?",
    a: "Driving lessons on Newdryve range from £35 to £40 per hour depending on the instructor. You can compare prices, transmission types (manual or automatic), specialisms, and ratings before booking.",
  },
  {
    q: "Can I pay by cash or bank transfer?",
    a: "Yes. Newdryve supports card payments, bank transfers (BACS / Faster Payments), and cash on arrival. Pick the option that suits you when booking.",
  },
  {
    q: "Which areas of Norwich does Newdryve cover?",
    a: "Newdryve currently covers Norwich City Centre, Thorpe St Andrew, Hellesdon, Wymondham, Hethersett, Cringleford, Sprowston, Old Catton, Costessey, Earlham, Bowthorpe, and Dereham Road.",
  },
  {
    q: "Do you offer automatic-only driving lessons?",
    a: "Yes. Several Newdryve instructors specialise in automatic transmission lessons, including instructors for mature and nervous learners.",
  },
  {
    q: "Can I cancel or reschedule a driving lesson?",
    a: "Yes. You can cancel or reschedule directly in the Newdryve app, subject to your instructor's notice period.",
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

export const INSTRUCTOR_LIST_JSONLD = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Verified driving instructors in Norwich",
  itemListOrder: "https://schema.org/ItemListOrderDescending",
  numberOfItems: INSTRUCTORS.length,
  itemListElement: INSTRUCTORS.map((ins, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Person",
      name: ins.name,
      jobTitle: "DVSA Approved Driving Instructor (ADI)",
      identifier: ins.adiNumber,
      description: ins.bio,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: ins.rating.toString(),
        reviewCount: ins.reviews.toString(),
        bestRating: "5",
      },
      areaServed: ins.areas.map((a) => ({ "@type": "Place", name: a })),
      knowsAbout: ins.specialisms,
    },
  })),
};

export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}
