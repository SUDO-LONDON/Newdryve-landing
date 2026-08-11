import { APP, BRAND } from '../config/site';

export type SeoPage = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  kicker: string;
  summary: string;
  lastReviewed: string;
  updatedNote?: string;
  schemaKind: 'Article' | 'Service';
  quickFacts: readonly { label: string; value: string }[];
  sections: readonly {
    heading: string;
    body: readonly string[];
    items?: readonly { title: string; body: string; href?: string }[];
  }[];
  faqs: readonly { q: string; a: string }[];
  related: readonly string[];
  sources: readonly { label: string; href: string }[];
};

const waitlistHref = '/#join';
const googlePlayHref = APP.android.live ? APP.android.url : waitlistHref;

const sources = {
  govBookTest: {
    label: 'GOV.UK: Book your practical driving test',
    href: 'https://www.gov.uk/book-driving-test',
  },
  govFees: {
    label: 'GOV.UK: Driving test costs',
    href: 'https://www.gov.uk/driving-test-cost',
  },
  govTheory: {
    label: 'GOV.UK: Theory test pass certificate number',
    href: 'https://www.gov.uk/find-theory-test-pass-number',
  },
  govAdi: {
    label: 'GOV.UK: Find driving schools, lessons and instructors',
    href: 'https://www.gov.uk/find-driving-schools-and-lessons',
  },
  govApprovedInstructor: {
    label: 'GOV.UK: Approved driving instructor register',
    href: 'https://www.gov.uk/driving-lessons-learning-to-drive/taking-driving-lessons',
  },
  govTestCentres: {
    label: 'GOV.UK: Find a driving test centre',
    href: 'https://www.gov.uk/find-driving-test-centre',
  },
  govWaitData: {
    label: 'GOV.UK: Car practical driving test waiting times',
    href: 'https://www.gov.uk/government/statistical-data-sets/car-practical-driving-test-waiting-times',
  },
  govLearning: {
    label: 'GOV.UK: Learning to drive',
    href: 'https://www.gov.uk/driving-lessons-learning-to-drive',
  },
  govLicenceCodes: {
    label: 'GOV.UK: Driving licence codes',
    href: 'https://www.gov.uk/driving-licence-codes',
  },
  racCost: {
    label: 'RAC: Cost of learning to drive',
    href: 'https://www.rac.co.uk/drive/advice/learning-to-drive/how-much-does-it-cost-to-learn-to-drive/',
  },
  dvsaReady: {
    label: 'Ready to Pass: How long it takes to learn',
    href: 'https://readytopass.campaign.gov.uk/driving-skills/how-long-it-takes-to-learn/',
  },
  wymondhamNorwich: {
    label: 'Rome2Rio: Wymondham to Norwich distance',
    href: 'https://www.rome2rio.com/s/Wymondham/Norwich',
  },
  derehamNorwich: {
    label: 'Rome2Rio: Dereham to Norwich distance',
    href: 'https://www.rome2rio.com/s/Dereham/Norwich',
  },
  attleboroughNorwich: {
    label: 'Rome2Rio: Attleborough to Norwich distance',
    href: 'https://www.rome2rio.com/s/Attleborough-Norfolk-England/Norwich',
  },
  dissNorwich: {
    label: 'Rome2Rio: Diss to Norwich distance',
    href: 'https://www.rome2rio.com/s/Diss/Norwich',
  },
  dissBury: {
    label: 'Rome2Rio: Diss to Bury St Edmunds distance',
    href: 'https://www.rome2rio.com/s/Diss/Bury-St-Edmunds',
  },
  norfolkA47: {
    label: 'Norfolk County Council: A47 development',
    href: 'https://www.norfolk.gov.uk/article/40000/A47-development',
  },
  wymondhamLocal: {
    label: 'Wymondham local geography',
    href: 'https://en.wikipedia.org/wiki/Wymondham',
  },
  attleboroughLocal: {
    label: 'Attleborough road context',
    href: 'https://en.wikipedia.org/wiki/Attleborough',
  },
  dissLocal: {
    label: 'Diss road context',
    href: 'https://en.wikivoyage.org/wiki/Diss',
  },
  dissApproaches: {
    label: 'Diss local approach descriptions',
    href: 'https://www.dissmethodistchurch.org.uk/find-us.htm',
  },
};

export const seoPages: readonly SeoPage[] = [
  {
    slug: 'driving-lessons/norwich',
    title: 'Driving Lessons in Norwich | Find a Verified Instructor | Newdryve',
    description:
      'Find driving lessons in Norwich, Thorpe St Andrew, Sprowston, Hellesdon, Costessey, Cringleford, Taverham, Drayton and nearby Norfolk areas.',
    h1: 'Driving lessons in Norwich',
    kicker: 'Norwich learner hub',
    summary:
      'Use this page to plan lessons in Norwich, understand the local practical test-centre options, and find a verified instructor through Newdryve without ringing around.',
    lastReviewed: '11 August 2026',
    schemaKind: 'Service',
    quickFacts: [
      {
        label: 'Nearby areas',
        value:
          'Thorpe St Andrew, Sprowston, Hellesdon, Costessey, Cringleford, Eaton, Taverham, Drayton and Old Catton',
      },
      { label: 'Local test centres', value: 'Peachman Way and Jupiter Road' },
      { label: 'Learner fee', value: 'Newdryve is free for learners' },
      { label: 'Booking action', value: 'Join the Norwich waitlist or use the Android app' },
    ],
    sections: [
      {
        heading: 'What learning to drive in Norwich involves',
        body: [
          'Norwich learners usually need a mix of quiet residential practice, busier urban junctions, ring-road driving, roundabouts, dual-carriageway confidence, and independent driving practice before they are ready for a practical test.',
          'The right instructor is not just someone with a free slot. You want an ADI-qualified instructor who can explain progress clearly, fit lessons around your week, and prepare you for the test centre that makes practical sense for your area.',
        ],
        items: [
          {
            title: 'Peachman Way',
            body: 'Useful for many learners on the east, north-east, and Broadland side of Norwich, including Thorpe St Andrew, Sprowston, Heartsease, Dussindale, Rackheath, Postwick and Brundall.',
            href: '/test-centres/norwich-peachman-way',
          },
          {
            title: 'Jupiter Road',
            body: 'A north Norwich option near Hellesdon, Mile Cross, Old Catton, Drayton, Taverham, Horsford, Spixworth and the airport side of the city.',
            href: '/test-centres/norwich-jupiter-road',
          },
          {
            title: 'Norfolk alternatives',
            body: 'King\'s Lynn, Lowestoft, and Bury St Edmunds can matter for some edge-of-county learners, but do not switch centres just to chase a date without asking your instructor.',
            href: '/test-centres',
          },
        ],
      },
      {
        heading: 'Surrounding areas learners often search from',
        body: [
          'Newdryve is Norwich-first, but learner demand around the city is naturally wider than the city centre. Nearby search and pickup areas include Thorpe St Andrew, Sprowston, Hellesdon, Costessey, Cringleford, Eaton, Taverham, Drayton, Old Catton, Bowthorpe, Rackheath, Brundall, Blofield, Wroxham and Wymondham.',
          'Coverage depends on real instructors opening real slots. These area names help learners understand the local footprint, but they are not a promise that every area has immediate availability today.',
        ],
        items: [
          {
            title: 'North and north-west Norwich',
            body: 'Hellesdon, Mile Cross, Old Catton, Drayton, Taverham, Horsford and Spixworth often look toward north Norwich routes and Jupiter Road preparation.',
            href: '/test-centres/norwich-jupiter-road',
          },
          {
            title: 'East and Broadland side',
            body: 'Thorpe St Andrew, Sprowston, Heartsease, Dussindale, Rackheath, Postwick, Brundall and Blofield often compare east Norwich routes and Peachman Way.',
            href: '/test-centres/norwich-peachman-way',
          },
          {
            title: 'South and west approaches',
            body: 'Costessey, Bowthorpe, Eaton, Cringleford, Wymondham, Long Stratton and nearby villages should choose by instructor pickup and realistic test-centre preparation.',
            href: '/test-centres',
          },
        ],
      },
      {
        heading: 'How Newdryve helps learners find an instructor',
        body: [
          'Newdryve is built around real instructor availability. Instead of sending messages and waiting for replies, learners can see instructors, lesson types, rates, specialisms, pickup areas, and open slots.',
          `Every Newdryve instructor profile is checked before it goes live. Learners do not pay Newdryve a booking fee or platform fee; you pay your instructor for lessons. Android learners can use Google Play now, and iOS learners can join the waitlist while the iOS app is prepared.`,
        ],
        items: [
          {
            title: 'Check fit before you book',
            body: 'Look for transmission type, lesson location, rate, availability, and whether the instructor knows the test centre you expect to use.',
            href: '/guides/how-to-find-a-driving-instructor',
          },
          {
            title: 'Plan your budget',
            body: 'Lesson prices vary by instructor and area. Our cost guide explains the moving parts without pretending there is one universal Norwich price.',
            href: '/guides/driving-lesson-cost',
          },
          {
            title: 'Track readiness',
            body: 'Use lessons to build the full skill set rather than counting hours alone. Hours matter, but quality and practice between lessons matter too.',
            href: '/guides/how-many-lessons-to-pass',
          },
        ],
      },
      {
        heading: 'A sensible Norwich learner route',
        body: [
          'Start with instructor fit and availability, then talk through which test centre suits your pickup area and regular driving routes. Once your instructor thinks you are nearing test standard, check official test availability and book only through GOV.UK.',
          'If slots are scarce, keep lessons moving. A booking date is useful only if you are genuinely ready by then; otherwise it can add pressure and cost.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Newdryve available for driving lessons in Norwich?',
        a: 'Newdryve is focused on Norwich first. Android is live, iOS learners can join the waitlist, and coverage depends on verified instructors opening real lesson slots.',
      },
      {
        q: 'Which Norwich driving test centre should I choose?',
        a: 'Choose the centre that makes practical sense for your pickup area, lesson routes, and instructor coverage. Compare Peachman Way and Jupiter Road, then confirm with your instructor before booking.',
      },
      {
        q: 'Does Newdryve charge learner booking fees?',
        a: 'No. Newdryve is free for learners. You pay your instructor for lessons.',
      },
    ],
    related: [
      'driving-lessons/wymondham',
      'driving-lessons/dereham',
      'driving-lessons/attleborough',
      'driving-lessons/diss',
      'test-centres',
      'test-centres/norwich-peachman-way',
      'test-centres/norwich-jupiter-road',
      'guides/driving-lesson-cost',
      'guides/how-to-find-a-driving-instructor',
    ],
    sources: [sources.govAdi, sources.govBookTest, sources.govTestCentres, sources.racCost],
  },
  {
    slug: 'driving-lessons/wymondham',
    title: 'Driving Lessons in Wymondham | Local Learner Guide | Newdryve',
    description:
      'Wymondham learner guide for driving lessons, Norwich test-centre choices, A11 practice, nearby villages, and Newdryve waitlist demand registration.',
    h1: 'Driving lessons in Wymondham',
    kicker: 'Wymondham learner guide',
    summary:
      'Newdryve is building its instructor network in Wymondham. This guide explains the local lesson context, Norwich test-centre choices, nearby villages, and how to register learner demand without assuming instructor coverage already exists.',
    lastReviewed: '11 August 2026',
    schemaKind: 'Service',
    quickFacts: [
      { label: 'Coverage status', value: 'No Newdryve instructor coverage is currently confirmed' },
      { label: 'Transmission', value: 'Manual and automatic availability not yet recorded' },
      { label: 'Likely test-centre area', value: 'Normally Norwich: Jupiter Road or Peachman Way' },
      {
        label: 'Nearby places',
        value:
          'Hethersett, Spooner Row, Wicklewood, Kimberley, Deopham, Hethel, Ashwellthorpe, Bunwell, Barford and Cringleford',
      },
    ],
    sections: [
      {
        heading: 'Wymondham and the Norwich test centres',
        body: [
          'Wymondham normally points toward Norwich for practical test planning. The two Norwich options are Jupiter Road in north Norwich and Peachman Way on the eastern side of the city. Wymondham is about 10 road miles from Norwich, so Norwich is usually more practical than King\'s Lynn, Lowestoft or Bury St Edmunds.',
          'Jupiter Road may be the more direct Norwich option from Wymondham, depending on route and traffic, because learners can approach Norwich from the A11 and west or north-west side. Peachman Way can still be relevant, but it usually means travelling farther around or across the city.',
        ],
        items: [
          {
            title: 'Jupiter Road',
            body: 'Often the first Norwich comparison from Wymondham, especially if lessons build toward the A11, Thickthorn and western approaches.',
            href: '/test-centres/norwich-jupiter-road',
          },
          {
            title: 'Peachman Way',
            body: 'Still a valid Norwich centre, but the journey from Wymondham can involve more cross-city or ring-road planning.',
            href: '/test-centres/norwich-peachman-way',
          },
          {
            title: 'Choose with your instructor',
            body: 'Do not treat any centre as mandatory. Pick the one your instructor can prepare you for properly from your pickup point.',
            href: '/test-centres',
          },
        ],
      },
      {
        heading: 'Local Wymondham driving practice',
        body: [
          'A useful Wymondham lesson plan should include town-centre control around the Market Place, Damgate Street and older streets where pedestrians, parked cars and narrower visibility matter. It should also include quieter residential work and route planning out toward nearby villages.',
          'The A11 is the major local feature for many learners. Lessons may need to cover joining, leaving, changing lanes, acceleration, deceleration and judgement around interchanges, including the Tuttles Lane area and routes connecting the A11, B1135 and B1172.',
        ],
        items: [
          {
            title: 'Village and rural judgement',
            body: 'Spooner Row, Wicklewood, Kimberley, Deopham, Hethel, Ashwellthorpe and Bunwell give learners useful practice with speed changes, bends and meeting traffic.',
          },
          {
            title: 'Norwich approach',
            body: 'Purely local Wymondham practice is not enough for a Norwich test. Longer lessons should build confidence toward Hethersett, Thickthorn and busier city roads.',
          },
          {
            title: 'Old Norwich Road option',
            body: 'The B1172/old Norwich Road can help learners progress before relying heavily on faster A11 driving.',
          },
        ],
      },
      {
        heading: 'Newdryve coverage status',
        body: [
          'No Newdryve instructor coverage is currently confirmed in Wymondham. Manual or automatic availability is not yet recorded, and pickup availability will need individual confirmation before lessons become available.',
          'Newdryve is building its instructor network in Wymondham. Join the learner waitlist and tell us your postcode, availability and whether you prefer manual or automatic lessons. We will use local demand to recruit verified instructors and confirm pickup coverage before any lesson is offered.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are Newdryve instructors already available in Wymondham?',
        a: 'Not confirmed yet. This page is a local learner guide and waitlist page, not a claim that instructors already cover Wymondham.',
      },
      {
        q: 'Which test centre should Wymondham learners use?',
        a: 'Norwich is normally the nearest practical-test area, with Jupiter Road and Peachman Way as the main options. Confirm the best centre with your instructor.',
      },
      {
        q: 'Can nearby villages join the Wymondham waitlist?',
        a: 'Yes. Learners around Hethersett, Spooner Row, Wicklewood, Hethel, Ashwellthorpe, Bunwell and nearby villages can register demand with their postcode.',
      },
    ],
    related: [
      'driving-lessons/norwich',
      'test-centres',
      'test-centres/norwich-jupiter-road',
      'test-centres/norwich-peachman-way',
      'guides/how-to-find-a-driving-instructor',
    ],
    sources: [sources.wymondhamNorwich, sources.wymondhamLocal, sources.govBookTest, sources.govTestCentres],
  },
  {
    slug: 'driving-lessons/dereham',
    title: 'Driving Lessons in Dereham | Local Learner Guide | Newdryve',
    description:
      'Dereham learner guide for driving lessons, Norwich and King\'s Lynn test-centre choices, A47 practice, nearby villages, and Newdryve waitlist demand.',
    h1: 'Driving lessons in Dereham',
    kicker: 'Dereham learner guide',
    summary:
      'Newdryve is measuring demand for driving lessons in Dereham, Toftwood and nearby villages. Use this guide to understand local practice, test-centre choices and honest current coverage status.',
    lastReviewed: '11 August 2026',
    schemaKind: 'Service',
    quickFacts: [
      { label: 'Coverage status', value: 'No Newdryve instructor coverage is currently confirmed' },
      { label: 'Transmission', value: 'Manual and automatic availability not yet recorded' },
      { label: 'Likely test-centre area', value: 'Normally Norwich, with a western King\'s Lynn boundary' },
      {
        label: 'Nearby places',
        value:
          'Toftwood, Scarning, Yaxham, Mattishall, North Tuddenham, Hockering, North Elmham, Swanton Morley, Beetley and Shipdham',
      },
    ],
    sections: [
      {
        heading: 'Dereham test-centre logic',
        body: [
          'Dereham normally feeds toward Norwich for practical test planning. Rome2Rio lists Dereham to Norwich at about 17.5 road miles, with a typical drive of about 29 minutes to the city. Jupiter Road will often be the more practical Norwich centre because it sits on the north-west side of Norwich.',
          'King\'s Lynn is the main alternative to compare, especially as you move west. Scarning and Dereham itself normally point toward Norwich, while Wendling and Fransham start to approach the divide. Necton and Swaffham increasingly make King\'s Lynn worth checking.',
        ],
        items: [
          {
            title: 'Norwich first for many learners',
            body: 'Jupiter Road is often the natural Norwich comparison from Dereham, but the right answer still depends on pickup point, instructor coverage and traffic.',
            href: '/test-centres/norwich-jupiter-road',
          },
          {
            title: 'Western boundary',
            body: 'Learners west of Dereham should compare their precise postcode rather than assuming Norwich is always the best option.',
            href: '/test-centres',
          },
          {
            title: 'Ask before booking',
            body: 'A test slot is useful only if your instructor can prepare you for that centre and attend with a suitable car.',
            href: '/guides/how-to-book-driving-test',
          },
        ],
      },
      {
        heading: 'Local Dereham driving practice',
        body: [
          'The A47 is the major local training feature. Norfolk County Council describes it as the main east-west strategic route across Norfolk, connecting Norwich, Dereham, Swaffham and King\'s Lynn. For learners, that means faster-road judgement, junction planning and safe gaps matter early.',
          'Useful Dereham lessons can also cover town-centre traffic, crossings, buses, parked vehicles, retail-area roundabouts and transitions from built-up streets to rural lanes around Yaxham, Mattishall, North Elmham and Swanton Morley.',
        ],
        items: [
          {
            title: 'A47 and A1075 work',
            body: 'Practise joining, leaving, lane positioning and speed choices around the A47/A1075 and Dereham junctions.',
          },
          {
            title: 'Rural-road judgement',
            body: 'Yaxham, Mattishall, North Elmham, Swanton Morley, Shipdham and Garvestone are useful references for meeting traffic and safe passing places.',
          },
          {
            title: 'Norwich approach',
            body: 'Build experience toward Norwich later in training, because Dereham-only driving will not reproduce the test-centre roads.',
          },
        ],
      },
      {
        heading: 'Newdryve coverage status',
        body: [
          'No Newdryve instructor coverage is currently confirmed in Dereham. Manual and automatic availability are unknown, and exact pickup coverage is not established.',
          'Newdryve is currently measuring demand for manual and automatic driving lessons in Dereham, Toftwood and nearby villages. Join the waitlist so we can prioritise instructors whose pickup area matches your postcode.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are Newdryve instructors available in Dereham now?',
        a: 'No confirmed coverage is recorded yet. Registering demand helps Newdryve decide where to recruit verified instructors.',
      },
      {
        q: 'Should Dereham learners choose Norwich or King\'s Lynn?',
        a: 'Dereham itself normally points toward Norwich, especially Jupiter Road, but west-of-town learners should compare King\'s Lynn as well.',
      },
      {
        q: 'What should the waitlist ask for?',
        a: 'Postcode, manual or automatic preference, weekday/evening/weekend availability, and whether you can meet in Dereham if home pickup is unavailable.',
      },
    ],
    related: [
      'driving-lessons/norwich',
      'test-centres',
      'test-centres/norwich-jupiter-road',
      'guides/how-to-book-driving-test',
      'guides/driving-test-waiting-times',
    ],
    sources: [sources.derehamNorwich, sources.norfolkA47, sources.govBookTest, sources.govTestCentres],
  },
  {
    slug: 'driving-lessons/attleborough',
    title: 'Driving Lessons in Attleborough | Local Learner Guide | Newdryve',
    description:
      'Attleborough learner guide for driving lessons, Norwich test-centre choices, A11 and B1077 practice, nearby villages, and Newdryve waitlist demand.',
    h1: 'Driving lessons in Attleborough',
    kicker: 'Attleborough learner guide',
    summary:
      'Newdryve is building demand for driving lessons in Attleborough and surrounding villages. This page explains Norwich test-centre logic, local road practice, and the honest current coverage position.',
    lastReviewed: '11 August 2026',
    schemaKind: 'Service',
    quickFacts: [
      { label: 'Coverage status', value: 'No Newdryve instructor coverage is currently confirmed' },
      { label: 'Transmission', value: 'Manual and automatic availability not yet recorded' },
      { label: 'Likely test-centre area', value: 'Normally Norwich, with Bury St Edmunds more relevant farther south-west' },
      {
        label: 'Nearby places',
        value:
          'Besthorpe, Old Buckenham, New Buckenham, Great Ellingham, Little Ellingham, Deopham, Spooner Row, Banham and Shropham',
      },
    ],
    sections: [
      {
        heading: 'Attleborough and the Norwich test centres',
        body: [
          'Attleborough normally points toward Norwich for practical test planning. Rome2Rio lists Attleborough to Norwich at about 16 road miles, with a typical drive of about 23 minutes to the city. The actual test-centre journey is longer because Jupiter Road and Peachman Way sit beyond the southern approach.',
          'Bury St Edmunds becomes more relevant as you travel south-west toward Thetford, but Norwich remains the natural comparison from Attleborough itself. Jupiter Road may involve routing around the west and north of Norwich, while Peachman Way is farther east, so traffic can change which centre feels easier.',
        ],
        items: [
          {
            title: 'Norwich is usually the starting point',
            body: 'Compare Jupiter Road and Peachman Way with your instructor before booking a practical test.',
            href: '/test-centres',
          },
          {
            title: 'Jupiter Road',
            body: 'Can make sense if lessons build toward the A11, Thickthorn and north/west Norwich approaches.',
            href: '/test-centres/norwich-jupiter-road',
          },
          {
            title: 'Peachman Way',
            body: 'Still possible, but learners should factor in cross-city or ring-road travel from Attleborough.',
            href: '/test-centres/norwich-peachman-way',
          },
        ],
      },
      {
        heading: 'Local Attleborough driving practice',
        body: [
          'Attleborough offers a useful mix for learners: A11 slip roads, acceleration and deceleration, larger junctions, the B1077 through town, and older town-centre streets where pedestrians, parked cars and limited visibility matter.',
          'Attleborough\'s historic centre includes a one-way system, and a realistic lesson plan should also include Station Road, railway-crossing awareness, newer residential estates, and rural roads toward Old Buckenham, Banham, Great Ellingham and New Buckenham.',
        ],
        items: [
          {
            title: 'A11 confidence',
            body: 'Practise safe gaps, lane positioning, acceleration, deceleration and planning at the northern and southern approaches.',
          },
          {
            title: 'Town-centre judgement',
            body: 'Church Street, Queen\'s Square and nearby older streets help learners manage visibility, pedestrians and parked vehicles.',
          },
          {
            title: 'Norwich transition',
            body: 'Later lessons should build from Attleborough toward Wymondham, Thickthorn and Norwich traffic conditions.',
          },
        ],
      },
      {
        heading: 'Newdryve coverage status',
        body: [
          'No Newdryve instructor coverage is currently confirmed in Attleborough. Manual and automatic status is unknown, and pickup requires confirmation before lessons can be offered.',
          'We are building the Newdryve learner waitlist in Attleborough and surrounding villages. Register your postcode and transmission preference to help us recruit verified local instructors where demand is strongest.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are Newdryve instructors available in Attleborough?',
        a: 'No confirmed instructor coverage is recorded yet. This page is a local guide and waitlist page.',
      },
      {
        q: 'Is Attleborough a Norwich test-centre town?',
        a: 'Normally yes for Attleborough itself, but Bury St Edmunds becomes more relevant farther south-west toward Thetford.',
      },
      {
        q: 'Can nearby villages register?',
        a: 'Yes. Learners around Old Buckenham, New Buckenham, Great Ellingham, Little Ellingham, Banham and Shropham can register demand with their postcode.',
      },
    ],
    related: [
      'driving-lessons/norwich',
      'driving-lessons/wymondham',
      'test-centres',
      'guides/how-to-find-a-driving-instructor',
      'guides/driving-lesson-cost',
    ],
    sources: [sources.attleboroughNorwich, sources.attleboroughLocal, sources.govBookTest, sources.govTestCentres],
  },
  {
    slug: 'driving-lessons/diss',
    title: 'Driving Lessons in Diss | Norwich vs Bury Test-Centre Guide | Newdryve',
    description:
      'Diss learner guide for driving lessons, Norwich vs Bury St Edmunds test-centre choices, A1066 and A140 practice, border villages, and Newdryve waitlist demand.',
    h1: 'Driving lessons in Diss',
    kicker: 'Diss learner guide',
    summary:
      'Diss needs careful test-centre planning because Norwich and Bury St Edmunds can be very similar by road. This page is a local learner guide and demand-registration page, not a claim of confirmed instructor coverage.',
    lastReviewed: '11 August 2026',
    schemaKind: 'Service',
    quickFacts: [
      { label: 'Coverage status', value: 'No Newdryve instructor coverage is currently confirmed' },
      { label: 'Transmission', value: 'Manual and automatic availability not yet recorded' },
      { label: 'Test-centre angle', value: 'Compare Norwich and Bury St Edmunds by postcode, route and traffic' },
      {
        label: 'Nearby places',
        value:
          'Roydon, Palgrave, Scole, Stuston, Burston, Bressingham, Shelfanger, Winfarthing, Dickleburgh, the Pulhams, Hoxne, Eye and Stradbroke',
      },
    ],
    sections: [
      {
        heading: 'Diss is a genuine boundary location',
        body: [
          'Diss should not be treated as a simple Norwich feeder town. Rome2Rio lists Diss to Norwich at about 22 road miles and around 33 minutes by car, while Diss to Bury St Edmunds is about 22.1 road miles and around 32 minutes. That makes postcode, route and traffic genuinely important.',
          'Learners in Diss commonly compare Norwich and Bury St Edmunds. The nearest or easiest option can vary by postcode, whether you are aiming for Jupiter Road or Peachman Way, where your instructor teaches, test availability, and how the A140 or Bury approach is moving.',
        ],
        items: [
          {
            title: 'Norwich comparison',
            body: 'Norwich may work for some learners, but both Norwich test centres sit north or east of the city rather than on the Diss side.',
            href: '/test-centres',
          },
          {
            title: 'Bury St Edmunds comparison',
            body: 'Bury can be as close or closer by road from parts of Diss, so it should be checked before committing practice to Norwich.',
          },
          {
            title: 'Ipswich edge cases',
            body: 'Learners south or south-east of Diss may also want to ask their instructor whether Ipswich should be considered.',
          },
        ],
      },
      {
        heading: 'Local Diss driving practice',
        body: [
          'Diss sits near the A140 and connects to it via the A1066. Local practice can include the A1066, access to the Scole bypass, roundabouts, traffic lights, pedestrian crossings, supermarket traffic and the B1077 route toward Attleborough.',
          'A realistic plan should also include town-centre roads with pedestrians, parked cars and constrained visibility, plus rural judgement around Roydon, Shelfanger, Winfarthing, Bressingham, Dickleburgh and the Pulhams. Local Diss lessons are useful, but later practice near the chosen test centre is essential.',
        ],
        items: [
          {
            title: 'A140 and A1066',
            body: 'Build faster-road judgement, roundabout planning and speed changes before using either Norwich or Bury test-centre routes.',
          },
          {
            title: 'Border-town reality',
            body: 'Roydon, Palgrave, Scole, Stuston, Hoxne, Eye and Stradbroke show why the Diss learner market crosses the Norfolk-Suffolk line.',
          },
          {
            title: 'Practise where you will test',
            body: 'Once a centre is chosen, build lessons around that centre. Diss-only driving will not reproduce Norwich or Bury St Edmunds conditions.',
          },
        ],
      },
      {
        heading: 'Newdryve coverage status',
        body: [
          'No Newdryve instructor coverage is currently confirmed in Diss. Transmission availability is unknown, and pickup must be individually agreed before lessons are offered.',
          'Newdryve is assessing demand for driving lessons in Diss and nearby Norfolk-Suffolk border villages. Join the waitlist with your postcode and manual or automatic preference. We will let you know when a verified instructor confirms coverage in your area.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Should Diss learners use Norwich or Bury St Edmunds?',
        a: 'Compare both. Diss is a boundary location, and the best centre can vary by postcode, traffic, instructor coverage and test availability.',
      },
      {
        q: 'Does Newdryve cover Diss yet?',
        a: 'No confirmed instructor coverage is recorded yet. The page is for local guidance and waitlist demand registration.',
      },
      {
        q: 'Can Suffolk-side villages use the Diss waitlist?',
        a: 'Yes. Diss functions as a Norfolk-Suffolk border town, so learners around Palgrave, Hoxne, Eye and Stradbroke can register demand with their postcode.',
      },
    ],
    related: [
      'driving-lessons/norwich',
      'driving-lessons/attleborough',
      'test-centres',
      'guides/how-to-book-driving-test',
      'guides/driving-test-waiting-times',
    ],
    sources: [
      sources.dissNorwich,
      sources.dissBury,
      sources.dissLocal,
      sources.dissApproaches,
      sources.govBookTest,
      sources.govTestCentres,
    ],
  },
  {
    slug: 'test-centres/norwich-peachman-way',
    title: 'Norwich Peachman Way Driving Test Centre | Address and Learner Guide',
    description:
      'Guide to Norwich Peachman Way driving test centre for learners around Thorpe St Andrew, Sprowston, Heartsease, Dussindale, Rackheath, Brundall and nearby areas.',
    h1: 'Norwich Peachman Way driving test centre',
    kicker: 'Test centre guide',
    summary:
      'Peachman Way is one of the Norwich practical driving test-centre options. Use this guide to understand the address, local preparation themes, and how it fits into Norwich lesson planning.',
    lastReviewed: '11 August 2026',
    updatedNote:
      'Always check your DVSA booking confirmation for the final address, date, time, and arrival instructions.',
    schemaKind: 'Article',
    quickFacts: [
      { label: 'Address', value: 'Peachman Way, Broadland Business Park, Norwich NR7 0WE' },
      { label: 'Use case', value: 'Practical car driving tests booked through GOV.UK' },
      {
        label: 'Nearby areas',
        value:
          'Thorpe St Andrew, Sprowston, Heartsease, Dussindale, Rackheath, Postwick, Brundall, Blofield, Acle and Wroxham',
      },
      { label: 'Do not rely on', value: 'Unofficial route predictions or pass-rate claims' },
    ],
    sections: [
      {
        heading: 'Where it is and who it may suit',
        body: [
          'The Peachman Way centre is in Broadland Business Park on the eastern side of Norwich. It may be a practical option for learners whose lessons often start around Thorpe St Andrew, Sprowston, Heartsease, Dussindale, Rackheath, Postwick, Brundall, Blofield, Acle, Wroxham, Salhouse and other east or north-east approaches.',
          'There is no public, fixed catchment rule that forces a learner to use this centre. The sensible choice is the one your instructor can prepare you for properly, with realistic lesson routes from your pickup area.',
        ],
        items: [
          {
            title: 'East Norwich suburbs',
            body: 'Thorpe St Andrew, Heartsease, Dussindale and Sprowston learners may find east-side Norwich preparation practical if their instructor covers those pickups.',
          },
          {
            title: 'Broadland villages',
            body: 'Rackheath, Postwick, Brundall, Blofield, Acle, Salhouse and Wroxham can come into the conversation depending on instructor coverage and travel time.',
          },
          {
            title: 'Boundary checks',
            body: 'If you are further out, compare Peachman Way with Jupiter Road or another regional centre before committing lessons to one plan.',
            href: '/test-centres',
          },
        ],
      },
      {
        heading: 'Local driving character to prepare for',
        body: [
          'Expect preparation to include business-park roads, varying speed limits, multi-lane roundabouts, residential judgement, busy commuter periods, and independent driving. Your instructor should build these skills across lessons rather than drilling memorised routes.',
          'A good test-centre plan includes safe arrival, a car that meets test requirements, documents ready, and enough recent practice that the first few minutes of the test do not feel unfamiliar.',
        ],
        items: [
          {
            title: 'Route familiarity without route chasing',
            body: 'Learn the road types and decision-making patterns around east Norwich rather than relying on claimed test routes.',
          },
          {
            title: 'Timing matters',
            body: 'Traffic can feel different around school times, commuting peaks, and business-park changeover periods. Practise varied times where possible.',
          },
          {
            title: 'Instructor fit',
            body: 'Ask your instructor how often they prepare learners for Peachman Way and whether your normal pickup point works for that plan.',
          },
        ],
      },
      {
        heading: 'How to book Peachman Way',
        body: [
          'Book only through the official GOV.UK practical test service or through your instructor if they are helping you with the booking process. You will need your UK driving licence number, a valid theory test pass, and payment details.',
          'If Peachman Way has no suitable dates, compare Jupiter Road and nearby regional centres with your instructor. A sooner date is not automatically better if it leaves you underprepared.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Peachman Way the same as Norwich driving test centre?',
        a: 'It is one Norwich practical driving test-centre location. Norwich also has Jupiter Road listed in learner searches and local driving-school references.',
      },
      {
        q: 'Can I choose Peachman Way if I live outside Norwich?',
        a: 'Usually yes, if a slot is available and you can attend with a suitable car. Ask your instructor whether it is a sensible preparation choice from your pickup area.',
      },
      {
        q: 'Does Newdryve show instructors who cover Peachman Way?',
        a: 'Newdryve instructor profiles can show pickup areas and availability. Where instructors cover Peachman Way preparation, learners can use that information before booking.',
      },
    ],
    related: [
      'driving-lessons/norwich',
      'test-centres',
      'test-centres/norwich-jupiter-road',
      'guides/how-to-book-driving-test',
      'guides/driving-test-waiting-times',
    ],
    sources: [sources.govBookTest, sources.govFees, sources.govTestCentres],
  },
  {
    slug: 'test-centres/norwich-jupiter-road',
    title: 'Norwich Jupiter Road Driving Test Centre | Address and Learner Guide',
    description:
      'Guide to Norwich Jupiter Road driving test centre for learners around Hellesdon, Old Catton, Mile Cross, Drayton, Taverham, Horsford and north Norwich.',
    h1: 'Norwich Jupiter Road driving test centre',
    kicker: 'Test centre guide',
    summary:
      'Jupiter Road is the north Norwich practical test-centre option many learners look for when planning lessons around Hellesdon, the airport side of Norwich, and north-west approaches.',
    lastReviewed: '11 August 2026',
    updatedNote:
      'DVSA locations and booking availability can change. Treat your official booking confirmation as the source of truth.',
    schemaKind: 'Article',
    quickFacts: [
      { label: 'Address', value: 'Jupiter Road, Norwich NR6 6SS' },
      { label: 'Use case', value: 'Practical car driving tests booked through GOV.UK' },
      {
        label: 'Nearby areas',
        value:
          'Hellesdon, Old Catton, Mile Cross, Drayton, Taverham, Horsford, Spixworth, Costessey, Aylsham and Reepham',
      },
      { label: 'Preparation focus', value: 'Urban judgement, roundabouts, lane discipline, and independent driving' },
    ],
    sections: [
      {
        heading: 'Where it is and who it may suit',
        body: [
          'Jupiter Road is on the north side of Norwich, close to Hellesdon, Old Catton, Mile Cross and airport-side routes. It can be a practical fit for learners whose lessons often start around Drayton, Taverham, Horsford, Spixworth, Costessey, Aylsham, Reepham or other north and north-west approaches.',
          'Do not choose it just because a search result says there is a slot. Ask your instructor whether your usual lesson area, pickup point, and current skill level make Jupiter Road a good choice.',
        ],
        items: [
          {
            title: 'North Norwich suburbs',
            body: 'Hellesdon, Mile Cross, Old Catton and the airport side of Norwich are natural reference points for Jupiter Road preparation.',
          },
          {
            title: 'North-west approaches',
            body: 'Drayton, Taverham, Costessey, Horsford, Spixworth, Aylsham and Reepham learners should check whether their instructor covers both pickup and test-centre practice.',
          },
          {
            title: 'Compare before booking',
            body: 'Some learners on the edge of the city may still be better served by Peachman Way or a regional centre, depending on routes and availability.',
            href: '/test-centres',
          },
        ],
      },
      {
        heading: 'Local driving character to prepare for',
        body: [
          'Preparation should cover residential roads, larger junctions, lane choice, speed changes, meeting traffic, and independent navigation. The goal is transferable judgement, not memorising a route list.',
          'North Norwich can require quick but calm decisions where local traffic, parked vehicles, and busier arterial roads meet. Your instructor should build those decisions into lessons before test day.',
        ],
        items: [
          {
            title: 'Arrive settled',
            body: 'Plan travel time to the centre and avoid making the first drive of the day the drive that starts your test.',
          },
          {
            title: 'Practise varied road types',
            body: 'A test can move quickly between quiet streets and busier junctions. Lessons should reflect that contrast.',
          },
          {
            title: 'Check your car and documents',
            body: 'Bring the right licence and use a car that meets DVSA test requirements. Your instructor can talk you through this before the date.',
          },
        ],
      },
      {
        heading: 'How to book Jupiter Road',
        body: [
          'Use the official GOV.UK booking service for practical driving tests. Have your driving licence number, theory test pass details, and payment method ready.',
          'If Jupiter Road dates are limited, compare Peachman Way and nearby centres with your instructor. Waiting-time pressure should not override test readiness.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Jupiter Road better than Peachman Way?',
        a: 'Neither centre is automatically better. The right choice depends on your location, instructor coverage, lesson routes, and available dates.',
      },
      {
        q: 'Should I practise exact Jupiter Road test routes?',
        a: 'No. Practise the local road types and decision-making skills instead. Exact route lists are unreliable and can make learners too narrow in preparation.',
      },
      {
        q: 'Can Newdryve help me find an instructor for Jupiter Road?',
        a: 'Newdryve lets learners compare verified instructors and real availability. Where an instructor covers north Norwich or Jupiter Road preparation, that can be shown on their profile.',
      },
    ],
    related: [
      'driving-lessons/norwich',
      'test-centres',
      'test-centres/norwich-peachman-way',
      'guides/how-to-book-driving-test',
      'guides/driving-test-waiting-times',
    ],
    sources: [sources.govBookTest, sources.govFees, sources.govTestCentres],
  },
  {
    slug: 'test-centres',
    title: 'Driving Test Centres near Norwich | Norwich and Norfolk Guide',
    description:
      'Compare driving test centres near Norwich and Norfolk areas including Wymondham, Dereham, Attleborough, Diss, Aylsham, North Walsham and Great Yarmouth.',
    h1: 'Driving test centres near Norwich',
    kicker: 'Norfolk test-centre hub',
    summary:
      'A practical hub for Norwich and Norfolk learners comparing test centres. Use it to choose sensibly, not to chase a date that leaves you underprepared.',
    lastReviewed: '11 August 2026',
    updatedNote:
      'Waiting times change frequently. Check the official booking service before making a decision.',
    schemaKind: 'Article',
    quickFacts: [
      { label: 'Norwich centres', value: 'Peachman Way and Jupiter Road' },
      { label: 'Nearby alternatives', value: 'King\'s Lynn, Lowestoft, and Bury St Edmunds' },
      {
        label: 'Norfolk areas',
        value:
          'Wymondham, Dereham, Attleborough, Diss, Aylsham, North Walsham, Great Yarmouth and Thetford',
      },
      { label: 'Booking source', value: 'GOV.UK practical test booking service' },
      { label: 'Decision rule', value: 'Pick the centre your instructor can prepare you for properly' },
    ],
    sections: [
      {
        heading: 'The Norwich options',
        body: [
          'Norwich learners commonly compare Peachman Way and Jupiter Road. That includes learners searching from Thorpe St Andrew, Sprowston, Hellesdon, Costessey, Cringleford, Eaton, Taverham, Drayton, Old Catton, Bowthorpe and other Norwich edges. Both centres need broad driving skill: judgement, observations, control, safe speed choices, lane discipline, and calm independent driving.',
          'The centre that looks closest on a map is not always the best practical choice. Consider your pickup area, lesson routes, instructor familiarity, and whether you can reach the centre calmly on test day.',
        ],
        items: [
          {
            title: 'Peachman Way',
            body: 'East Norwich and Broadland-side context. Useful for many learners who practise around the east and north-east of the city.',
            href: '/test-centres/norwich-peachman-way',
          },
          {
            title: 'Jupiter Road',
            body: 'North Norwich context. Often relevant for learners around Hellesdon, airport-side routes, and north-west approaches.',
            href: '/test-centres/norwich-jupiter-road',
          },
        ],
      },
      {
        heading: 'When nearby centres matter',
        body: [
          'King\'s Lynn, Lowestoft, Bury St Edmunds and other regional centres can become relevant for learners near the edge of Norfolk or learners whose instructor already teaches around those towns. This can include learners around Wymondham, Dereham, Attleborough, Diss, Aylsham, North Walsham, Great Yarmouth, Thetford, Fakenham and Downham Market.',
          'A different centre can mean different roads, more travel time, and less familiar driving context. That can be fine if planned early, but risky if it is a last-minute reaction to waiting times.',
        ],
        items: [
          {
            title: 'South Norfolk',
            body: 'Wymondham, Attleborough, Diss, Long Stratton and Thetford learners should compare travel time, instructor coverage and road familiarity before choosing a centre.',
          },
          {
            title: 'Mid and north Norfolk',
            body: 'Dereham, Aylsham, North Walsham, Fakenham and nearby villages may need a different test-centre conversation from central Norwich learners.',
          },
          {
            title: 'East coast side',
            body: 'Great Yarmouth, Lowestoft, Beccles and coastal-area learners should not assume a Norwich centre is the practical default.',
          },
        ],
      },
      {
        heading: 'How to choose without creating extra risk',
        body: [
          'First, decide with your instructor where your normal lessons can prepare you well. Then look at availability. If a second-choice centre has an earlier date, ask how many lessons would be needed to adapt your preparation.',
          'Use cancellation-checking carefully. A cancelled slot is useful only when your instructor and car are available, you can get there, and you are ready to drive independently under test conditions.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can I book any driving test centre?',
        a: 'In general, you can choose a centre with available slots if you can attend with a suitable car, but the practical choice should be guided by instructor coverage and preparation.',
      },
      {
        q: 'Are Norwich test-centre waiting times shown here live?',
        a: 'No. This page links to GOV.UK and explains the decision process. Check the official booking service for live availability before booking.',
      },
      {
        q: 'Should I switch from Norwich to King\'s Lynn, Lowestoft, or Bury St Edmunds?',
        a: 'Only if your instructor agrees that the travel, road types, and preparation plan make sense. A faster slot is not worth much if it lowers your chance of passing.',
      },
    ],
    related: [
      'driving-lessons/norwich',
      'driving-lessons/wymondham',
      'driving-lessons/dereham',
      'driving-lessons/attleborough',
      'driving-lessons/diss',
      'test-centres/norwich-peachman-way',
      'test-centres/norwich-jupiter-road',
      'guides/how-to-book-driving-test',
      'guides/driving-test-waiting-times',
    ],
    sources: [sources.govTestCentres, sources.govBookTest, sources.govWaitData],
  },
  {
    slug: 'guides/driving-lesson-cost',
    title: 'How Much Do Driving Lessons Cost? UK and Norwich Guide | Newdryve',
    description:
      'A practical guide to UK driving lesson costs, Norwich context, manual vs automatic pricing, test fees, and how Newdryve stays free for learners.',
    h1: 'How much do driving lessons cost?',
    kicker: 'Learner cost guide',
    summary:
      'Driving lesson costs vary by instructor, transmission, lesson length, and location. This guide separates instructor pricing from official test fees and explains how to budget honestly.',
    lastReviewed: '11 August 2026',
    schemaKind: 'Article',
    quickFacts: [
      { label: 'Common hourly range', value: 'Around \u00a335 to \u00a345 per hour in many UK areas' },
      { label: 'Official practical test fee', value: '\u00a362 weekday, \u00a375 evening/weekend/bank holiday' },
      { label: 'Theory test fee', value: '\u00a323 for a car theory test' },
      { label: 'Newdryve learner fee', value: '\u00a30 platform fee' },
    ],
    sections: [
      {
        heading: 'The real cost is lessons plus official fees',
        body: [
          'Most learners should budget for instructor lessons, the theory test, the practical test, and possible extra practice close to test day. The official practical car test fee is lower than the lesson total for most learners, but it still matters when planning.',
          'RAC guidance puts many current UK lesson prices around the mid-\u00a330s to mid-\u00a340s per hour, with local variation. Norwich prices can sit within that range, but the only honest number is the rate your chosen instructor actually publishes.',
        ],
      },
      {
        heading: 'What changes lesson price',
        body: [
          'Instructor experience, location, fuel and insurance costs, car type, lesson length, peak-time demand, and whether you learn manual or automatic can all affect the rate.',
          'Block booking can sometimes reduce the per-hour price, but do not buy a large block until you are comfortable with the instructor and their teaching style.',
        ],
        items: [
          {
            title: 'Manual lessons',
            body: 'Often easier to find and may give more instructor choice in some areas.',
            href: '/guides/manual-vs-automatic',
          },
          {
            title: 'Automatic lessons',
            body: 'Can be simpler mechanically for some learners, but availability and hourly cost can vary by area.',
            href: '/guides/manual-vs-automatic',
          },
          {
            title: 'Test-centre preparation',
            body: 'Extra lessons near a test centre may be useful, but they should develop judgement rather than memorised routes.',
            href: '/test-centres',
          },
        ],
      },
      {
        heading: 'How Newdryve pricing works',
        body: [
          'Newdryve does not charge learners a booking fee. Instructors set their own lesson rates, and learners can see the rate before booking. You pay your instructor for the lesson.',
          'That means your comparison should focus on fit, availability, car type, pickup area, and the instructor rate shown, rather than hidden platform charges.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is the cheapest driving instructor always best?',
        a: 'No. A lower hourly rate can cost more overall if lessons are poorly structured. Compare rate, reliability, teaching style, and progress tracking.',
      },
      {
        q: 'Are practical test fees included in lesson prices?',
        a: 'Usually not. Practical and theory test fees are official DVSA fees paid through GOV.UK, separate from instructor lesson fees.',
      },
      {
        q: 'Does Newdryve add a learner booking fee?',
        a: 'No. Newdryve is free for learners.',
      },
    ],
    related: [
      'guides/how-many-lessons-to-pass',
      'guides/manual-vs-automatic',
      'guides/how-to-find-a-driving-instructor',
      'driving-lessons/norwich',
    ],
    sources: [sources.racCost, sources.govFees],
  },
  {
    slug: 'guides/how-many-lessons-to-pass',
    title: 'How Many Driving Lessons Do You Need to Pass? | Newdryve',
    description:
      'Learn how many driving lessons learners commonly need, what affects progress, and how to plan lessons without relying on a single average.',
    h1: 'How many driving lessons do you need to pass?',
    kicker: 'Progress guide',
    summary:
      'There is no fixed number of lessons. DVSA campaign guidance says many learners need about 45 hours of professional lessons plus about 22 hours of private practice, but your real path depends on progress.',
    lastReviewed: '11 August 2026',
    schemaKind: 'Article',
    quickFacts: [
      { label: 'Common benchmark', value: 'About 45 hours of lessons plus 22 hours of private practice' },
      { label: 'Main variable', value: 'Quality and frequency of practice' },
      { label: 'Best signal', value: 'Consistent safe independent driving' },
      { label: 'Newdryve role', value: 'Track lessons, skills, and readiness' },
    ],
    sections: [
      {
        heading: 'Use averages as a planning tool, not a promise',
        body: [
          'DVSA-backed learner guidance commonly points to about 45 hours of professional lessons and about 22 hours of private practice. Some learners need less, many need more.',
          'The important question is not whether you have reached a magic number. It is whether you can drive safely, legally, and independently across the range of situations your test and real driving can involve.',
        ],
      },
      {
        heading: 'What changes the number of lessons',
        body: [
          'Progress is affected by lesson frequency, private practice, road confidence, theory knowledge, anxiety, instructor fit, manual or automatic transmission, and how varied your driving experience is.',
          'Two-hour weekly lessons often build continuity better than occasional one-hour lessons, but the right pattern depends on concentration, budget, and instructor availability.',
        ],
        items: [
          {
            title: 'Private practice',
            body: 'Can help if it is safe, legal, and reinforces good habits taught by your instructor.',
          },
          {
            title: 'Instructor fit',
            body: 'A good instructor gives clear feedback and adapts lessons to your weak spots.',
            href: '/guides/how-to-find-a-driving-instructor',
          },
          {
            title: 'Test timing',
            body: 'Booking too early can create pressure; booking too late can drag out cost. Use your instructor\'s readiness view.',
            href: '/guides/how-to-book-driving-test',
          },
        ],
      },
      {
        heading: 'How to tell you are getting close',
        body: [
          'You should be able to handle junctions, roundabouts, mirrors, signals, speed choice, meeting traffic, parking, and independent driving without repeated instructor prompts.',
          'Newdryve is designed to make that progress visible so the test decision is based on readiness rather than hope.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can I pass after 20 hours?',
        a: 'Some learners can, especially with strong private practice, but it is not a safe assumption. Let consistent independent driving decide.',
      },
      {
        q: 'Do automatic learners need fewer lessons?',
        a: 'Some do because there is less clutch and gear work, but road judgement still takes time. Automatic is not a shortcut around learning to drive safely.',
      },
      {
        q: 'When should I book my practical test?',
        a: 'Book when your instructor believes you have a realistic path to being test-ready by the date, while allowing for local waiting times.',
      },
    ],
    related: [
      'guides/driving-lesson-cost',
      'guides/how-to-book-driving-test',
      'guides/manual-vs-automatic',
      'driving-lessons/norwich',
    ],
    sources: [sources.dvsaReady, sources.govLearning],
  },
  {
    slug: 'guides/how-to-book-driving-test',
    title: 'How to Book Your Driving Test | Practical Test Guide | Newdryve',
    description:
      'How to book a UK practical driving test, what you need, how to choose a Norwich test centre, and how to avoid unofficial booking traps.',
    h1: 'How to book your driving test',
    kicker: 'Practical test booking',
    summary:
      'Book through GOV.UK, have the right details ready, choose a centre you can prepare for, and avoid paying unnecessary third-party booking fees.',
    lastReviewed: '11 August 2026',
    schemaKind: 'Article',
    quickFacts: [
      { label: 'Book through', value: 'GOV.UK practical driving test service' },
      { label: 'You need', value: 'Driving licence number, theory pass, and payment card' },
      { label: 'Car practical fee', value: '\u00a362 weekday or \u00a375 evening/weekend/bank holiday' },
      { label: 'Norwich choices', value: 'Peachman Way or Jupiter Road' },
    ],
    sections: [
      {
        heading: 'Before you book',
        body: [
          'You need to have passed the theory test before booking a car practical test. You will also need your UK driving licence number and a payment method.',
          'Talk to your instructor before booking. They need to know the date, the centre, whether their car is available, and whether your current progress makes the date realistic.',
        ],
      },
      {
        heading: 'Choosing a test centre',
        body: [
          'For Norwich learners, Peachman Way and Jupiter Road are the two main local choices. Nearby regional centres can be relevant for some Norfolk learners, but switching centre can mean a different preparation plan.',
          'Use availability as one factor, not the whole decision. A centre with a sooner date can cost more in extra lessons or lower your pass chance if the road context is unfamiliar.',
        ],
        items: [
          {
            title: 'Compare Norwich centres',
            body: 'Use the test-centre hub to compare local and regional options.',
            href: '/test-centres',
          },
          {
            title: 'Check waiting-time pressure',
            body: 'Understand why slots move and how cancellations work before chasing dates.',
            href: '/guides/driving-test-waiting-times',
          },
          {
            title: 'Confirm readiness',
            body: 'Use your lessons and instructor feedback to decide whether the date is realistic.',
            href: '/guides/how-many-lessons-to-pass',
          },
        ],
      },
      {
        heading: 'Avoid booking traps',
        body: [
          'Use the official GOV.UK booking service where possible. Third-party sites may charge extra, may not show the same information clearly, or may create avoidable confusion around cancellations.',
          'If you need to change a test, use the official guidance and make sure your instructor can still attend. Never assume your instructor is free just because the booking system shows a test slot.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can my instructor book my driving test for me?',
        a: 'Some instructors help learners with the process, but you should still understand the centre, date, fee, and official confirmation.',
      },
      {
        q: 'What if I lost my theory test certificate number?',
        a: 'GOV.UK has a service to find your theory test pass certificate number.',
      },
      {
        q: 'Should I book before I am ready?',
        a: 'Only if your instructor agrees there is enough time to become test-ready by that date. Booking too early can waste money and add pressure.',
      },
    ],
    related: [
      'test-centres',
      'guides/driving-test-waiting-times',
      'guides/how-many-lessons-to-pass',
      'driving-lessons/norwich',
    ],
    sources: [sources.govBookTest, sources.govFees, sources.govTheory],
  },
  {
    slug: 'guides/manual-vs-automatic',
    title: 'Manual vs Automatic Driving Lessons | Which Should You Learn In?',
    description:
      'Compare manual and automatic driving lessons, licence implications, cost, availability, and how to choose the right transmission for your learning style.',
    h1: 'Manual vs automatic: which should you learn in?',
    kicker: 'Transmission guide',
    summary:
      'Manual and automatic lessons can both be the right choice. The key difference is licence flexibility: passing in an automatic normally restricts you to automatic vehicles.',
    lastReviewed: '11 August 2026',
    schemaKind: 'Article',
    quickFacts: [
      { label: 'Manual pass', value: 'Lets you drive manual and automatic category B cars' },
      { label: 'Automatic pass', value: 'Usually restricts you to automatic category B cars' },
      { label: 'Licence code', value: 'Code 78 indicates restricted to automatic transmission' },
      { label: 'Best choice', value: 'Depends on confidence, budget, car plans, and instructor availability' },
    ],
    sections: [
      {
        heading: 'The licence difference',
        body: [
          'If you pass a manual category B car test, you can drive both manual and automatic cars in that category. If you pass in an automatic, your licence is normally restricted to automatic cars.',
          'That restriction matters if you expect to drive work vehicles, shared family cars, older cars, or hire cars where manual may still be common.',
        ],
      },
      {
        heading: 'Learning difference',
        body: [
          'Manual lessons include clutch control and gear selection, which can take time. Automatic lessons remove that mechanical workload, so some learners can focus sooner on road judgement.',
          'Automatic is not easier in every way. You still need observation, anticipation, speed control, positioning, hazard response, and safe independent driving.',
        ],
        items: [
          {
            title: 'Choose manual if',
            body: 'You want maximum licence flexibility, expect to use manual cars, or have good local manual instructor availability.',
          },
          {
            title: 'Choose automatic if',
            body: 'You expect to drive automatics, find clutch work a major barrier, or can access a reliable automatic instructor.',
          },
          {
            title: 'Check the local market',
            body: 'Automatic instructors can be scarcer or more expensive in some areas. Compare real availability before deciding.',
            href: '/driving-lessons/norwich',
          },
        ],
      },
      {
        heading: 'Cost and availability',
        body: [
          'The cheaper option is not always obvious. Manual may have a lower hourly rate or wider instructor choice, while automatic may reduce the number of lessons for some learners. Your total cost depends on progress, not only hourly price.',
          'Newdryve lets learners compare manual and automatic instructor profiles where coverage exists, so you can see the real rate and availability before booking.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can I switch from manual to automatic?',
        a: 'Yes. Many learners switch if manual control is slowing progress or causing stress. Discuss timing with your instructor.',
      },
      {
        q: 'Can I drive a manual if I pass in an automatic?',
        a: 'No, not normally. An automatic pass usually restricts you to automatic vehicles unless you later pass a manual test.',
      },
      {
        q: 'Are automatic lessons more expensive?',
        a: 'They can be in some areas, especially where automatic instructors are scarce, but local instructor rates vary.',
      },
    ],
    related: [
      'guides/driving-lesson-cost',
      'guides/how-many-lessons-to-pass',
      'guides/how-to-find-a-driving-instructor',
      'driving-lessons/norwich',
    ],
    sources: [sources.govLearning, sources.govLicenceCodes, sources.racCost],
  },
  {
    slug: 'guides/how-to-find-a-driving-instructor',
    title: 'How to Find a Good Driving Instructor | Newdryve',
    description:
      'A practical checklist for choosing a driving instructor: ADI status, DBS checks, availability, reviews, teaching fit, red flags, and how Newdryve helps.',
    h1: 'How to find a good driving instructor',
    kicker: 'Instructor choice guide',
    summary:
      'A good instructor is qualified, clear, reliable, and available enough to build momentum. This guide gives learners a practical checklist before booking.',
    lastReviewed: '11 August 2026',
    schemaKind: 'Article',
    quickFacts: [
      { label: 'Qualification', value: 'Look for ADI-qualified instruction' },
      { label: 'Checks', value: 'DBS-checked where claimed and verified' },
      { label: 'Availability', value: 'Real slots matter more than vague promises' },
      { label: 'Newdryve role', value: 'Verified profiles, rates, pickup areas, and real availability' },
    ],
    sections: [
      {
        heading: 'What to check first',
        body: [
          'Start with qualification, insurance, car type, pickup area, price, availability, and whether the instructor teaches near the test centre you are likely to use.',
          'Then look at communication. A good instructor explains progress, gives specific feedback, and helps you understand what each lesson is trying to improve.',
        ],
        items: [
          {
            title: 'ADI status',
            body: 'Approved Driving Instructors are registered to teach for payment. You can use GOV.UK services to find driving schools and instructors.',
          },
          {
            title: 'Fit and communication',
            body: 'You should feel able to ask questions and understand feedback without guessing what went wrong.',
          },
          {
            title: 'Practical availability',
            body: 'A great instructor with no regular slots may not be right if you need weekly momentum.',
          },
        ],
      },
      {
        heading: 'Red flags',
        body: [
          'Be cautious if an instructor is unclear about pricing, repeatedly cancels without notice, avoids discussing progress, pressures you into a very large prepaid block, or makes unsupported claims about pass rates.',
          'Also be careful with route promises. A good instructor prepares you for test-standard driving, not a memorised list of roads.',
        ],
      },
      {
        heading: 'How Newdryve improves the search',
        body: [
          'Newdryve is designed to replace phone-tag with structured profiles and real booking slots. Learners can compare instructor rate, transmission, pickup area, availability, and profile details before committing.',
          'That does not remove the need for judgement, but it makes the first shortlist much stronger and reduces wasted time.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What does ADI mean?',
        a: 'ADI means Approved Driving Instructor. It is the qualification for someone approved to charge for driving lessons.',
      },
      {
        q: 'Should I choose by reviews only?',
        a: 'No. Reviews can help, but also check availability, teaching fit, car type, location, and whether the instructor can prepare you for your likely test centre.',
      },
      {
        q: 'Can I change instructor?',
        a: 'Yes. If lessons are not structured, reliable, or a good fit, changing instructor can be the right move.',
      },
    ],
    related: [
      'driving-lessons/norwich',
      'guides/driving-lesson-cost',
      'guides/how-many-lessons-to-pass',
      'test-centres',
    ],
    sources: [sources.govAdi, sources.govApprovedInstructor],
  },
  {
    slug: 'guides/driving-test-waiting-times',
    title: 'Driving Test Waiting Times Explained | Newdryve',
    description:
      'Understand UK driving test waiting times, why practical test slots can be scarce, how cancellations work, and how Norwich learners should plan.',
    h1: 'Driving test waiting times explained',
    kicker: 'Waiting-time guide',
    summary:
      'Driving test waiting times move as learners book, cancel, and rebook. This guide explains how to use waiting-time data without making bad test-centre decisions.',
    lastReviewed: '11 August 2026',
    updatedNote:
      'GOV.UK publishes waiting-time datasets periodically. Live availability still comes from the official booking service.',
    schemaKind: 'Article',
    quickFacts: [
      { label: 'Live slots', value: 'Check the official GOV.UK booking service' },
      { label: 'Published data', value: 'GOV.UK waiting-time datasets are periodic, not live' },
      { label: 'Common cause', value: 'Demand, cancellations, examiner capacity, and local backlog' },
      { label: 'Best response', value: 'Keep preparing and book a centre you can genuinely handle' },
    ],
    sections: [
      {
        heading: 'Why there can be a wait',
        body: [
          'Practical driving tests depend on examiner capacity, test-centre availability, learner demand, cancellations, and local disruption. A backlog in one area can push learners to nearby centres, which then affects those centres too.',
          'The post-COVID backlog changed learner expectations across the UK. Even when availability improves nationally, individual centres can still feel tight because local demand changes week by week.',
        ],
      },
      {
        heading: 'How to use cancellations sensibly',
        body: [
          'Cancellation slots can help, but they are useful only if you, your instructor, and the car are available and you are test-ready. A short-notice slot can be a gift or a bad decision.',
          'Before taking a cancellation, check the centre, date, time, travel plan, instructor availability, and whether the route context is one you have prepared for.',
        ],
        items: [
          {
            title: 'Do not chase every centre',
            body: 'A random earlier slot can mean unfamiliar roads and extra lessons.',
            href: '/test-centres',
          },
          {
            title: 'Keep lessons consistent',
            body: 'Waiting time is easier to manage if your skills continue improving while you wait.',
            href: '/guides/how-many-lessons-to-pass',
          },
          {
            title: 'Book officially',
            body: 'Use GOV.UK and avoid paying unnecessary third-party fees.',
            href: '/guides/how-to-book-driving-test',
          },
        ],
      },
      {
        heading: 'Norwich learner context',
        body: [
          'Norwich learners usually compare Peachman Way and Jupiter Road first. Nearby centres such as King\'s Lynn, Lowestoft, and Bury St Edmunds may appear in wider searches, but each needs a realistic preparation plan.',
          'If you are using Newdryve, choose instructors with availability that helps you keep steady lesson momentum while you wait for the right test date.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are driving test waiting times live?',
        a: 'Published datasets are not live. The GOV.UK booking service is the place to check live availability.',
      },
      {
        q: 'Should I use a cancellation app?',
        a: 'Only carefully. Make sure any slot you accept works for your instructor, car, centre, and readiness level.',
      },
      {
        q: 'Does a longer wait mean I should stop lessons?',
        a: 'Usually no. You may reduce frequency, but stopping completely can make you rusty and increase total cost later.',
      },
    ],
    related: [
      'guides/how-to-book-driving-test',
      'test-centres',
      'driving-lessons/norwich',
      'guides/how-many-lessons-to-pass',
    ],
    sources: [sources.govWaitData, sources.govBookTest],
  },
];

export const seoPageMap = new Map(seoPages.map((page) => [page.slug, page]));

export function getRelatedPages(page: SeoPage) {
  return page.related
    .map((slug) => seoPageMap.get(slug))
    .filter((relatedPage): relatedPage is SeoPage => Boolean(relatedPage));
}

export function pagePath(page: Pick<SeoPage, 'slug'>) {
  return `/${page.slug}`;
}

export function conversionHref() {
  return googlePlayHref;
}

export function conversionLabel() {
  return APP.android.live ? 'Get the Android app' : 'Join the waitlist';
}

export function waitlistLabel() {
  return `Join the ${BRAND.city} waitlist`;
}
