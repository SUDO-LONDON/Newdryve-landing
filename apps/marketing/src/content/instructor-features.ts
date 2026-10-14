/**
 * What the instructor app does, as stated on /instructors and
 * /instructors/features. One list so the two pages can never disagree.
 *
 * Every line here was confirmed by the founder (October 2026). Do not add a
 * feature that is not live in the App Store and Google Play builds: calendar
 * sync and lesson blocks are NOT available yet, and the app does not file tax
 * returns.
 */

import { PRICING } from '../config/site';

export type InstructorFeature = {
  id: string;
  title: string;
  /** One sentence for the overview grid on /instructors. */
  summary: string;
  /** The fuller explanation on /instructors/features. */
  detail: readonly string[];
  points: readonly string[];
};

export const INSTRUCTOR_FEATURES: readonly InstructorFeature[] = [
  {
    id: 'diary',
    title: 'Diary and availability',
    summary: 'Set your working hours, block time off and see your whole week in one diary.',
    detail: [
      'Your diary is where Newdryve starts. Set the hours you teach and the areas you cover, and learners can only book the slots you actually have free.',
      'Pupils who are not on Newdryve yet still need a place in your week, so you can block out time for them by hand. Nothing gets double-booked.',
    ],
    points: [
      'Working hours, time off and travel time between lessons',
      'Move or cancel lessons',
      'A full week view of every lesson',
      'Block out time for pupils you have not moved onto the app yet',
    ],
  },
  {
    id: 'pupils',
    title: 'Your existing pupils',
    summary: 'Send your pupils your link. They sign in, land on your profile and book you.',
    detail: [
      'You do not have to start again. Send your pupils your own Newdryve link: once they sign in, it takes them straight to your profile, where they book their lessons with you.',
      'Once a pupil is on Newdryve, their lessons, payments, cancellation protection and progress all live in one place.',
    ],
    points: [
      'Your own link to share with the pupils you already teach',
      'Pupils land on your profile and book with you directly',
      'Lesson history and notes kept with each pupil',
    ],
  },
  {
    id: 'progress',
    title: 'Progress mapped to the driving test',
    summary: 'Track every skill against the DVSA test standard and see when a pupil is test-ready.',
    detail: [
      'Progress is recorded against the skills the DVSA practical test assesses, so you and your pupil can see exactly what is solid, what needs work and when they are ready to book their test.',
      'The progress record belongs to the learner, and you see it too. It goes with them, so nothing is lost if they change instructor.',
    ],
    points: [
      'Skills mapped to the DVSA practical test',
      'Test readiness at a glance',
      'Lesson notes alongside the skills you covered',
      'Your pupil sees the same progress you do',
    ],
  },
  {
    id: 'payments',
    title: 'Payments your way',
    summary: 'Take card, cash or bank transfer, and choose how each lesson was paid.',
    detail: [
      'At the end of each lesson you choose how it was paid: card, cash or bank transfer. Newdryve takes 0% commission on lesson payments; Stripe’s standard processing fee applies only when you choose card.',
    ],
    points: [
      'Card, cash or bank transfer',
      `${PRICING.commission} Newdryve commission on lesson payments`,
      'Every learner booking secured by a saved card',
    ],
  },
  {
    id: 'cancellations',
    title: 'Cancellation protection',
    summary: `A ${PRICING.lateCancellationShare} fee inside ${PRICING.lateCancellationWindow}, the full price inside ${PRICING.finalCancellationWindow}. Charged automatically.`,
    detail: [
      `Learners cannot book without a valid card saved. If one cancels within ${PRICING.lateCancellationWindow} of the lesson, a ${PRICING.lateCancellationShare} cancellation fee is charged automatically and paid to you, rising to the full lesson price within ${PRICING.finalCancellationWindow} of the start. No awkward conversations and no chasing.`,
    ],
    points: [
      'A saved card on every booking',
      `${PRICING.lateCancellationShare} fee within ${PRICING.lateCancellationWindow}, full price within ${PRICING.finalCancellationWindow}`,
      'Paid to you; Newdryve takes nothing from it',
    ],
  },
  {
    id: 'money',
    title: 'Earnings, expenses and your accountant',
    summary: 'Track earnings, scan receipts for expenses and export PDF and CSV for your accountant.',
    detail: [
      'See what you have earned, scan receipts as you go and keep your business expenses organised. When your accountant asks, export everything as a PDF or CSV and send it over.',
    ],
    points: [
      'Earnings and statements',
      'Receipt scanning for expenses',
      'PDF and CSV exports for your accountant',
    ],
  },
  {
    id: 'messages',
    title: 'Reminders and messages',
    summary: 'Lesson reminders go out for you, and your pupil messages stay in the app.',
    detail: [
      'Lesson reminders are sent for you, and your conversations with pupils stay in Newdryve rather than scattered across texts and WhatsApp.',
    ],
    points: ['Automatic lesson reminders', 'Messages with your pupils in the app'],
  },
  {
    id: 'road-board',
    title: 'Road Board',
    summary: 'Draw a junction or roundabout and play the vehicles through it to explain it.',
    detail: [
      'Some things are easier to show than to say. Road Board lets you sketch a road layout and play vehicles through it, so a pupil can see exactly what happens at a tricky junction or roundabout.',
    ],
    points: ['Draw road layouts in seconds', 'Play back vehicle movements step by step'],
  },
  {
    id: 'new-learners',
    title: 'New learners from the marketplace',
    summary: 'Learners searching in your area find your profile and book a slot in under a minute.',
    detail: [
      'On top of running your business, Newdryve brings you pupils you did not have. Your profile appears to learners searching in your area, with your rate, specialisms and real availability, and they can book a slot in under a minute.',
    ],
    points: [
      'A profile with your rate, specialisms and areas',
      'Learners book your real free slots, no back-and-forth',
      'Your own prices, always',
    ],
  },
];

/** For driving schools rather than individual instructors. */
export const SCHOOL_FEATURES = {
  title: 'Running a driving school?',
  body: 'Newdryve has a dashboard for schools and organisations: see what each of your instructors is doing, their timesheets and their pupils, and send instructors their weekly invoices.',
} as const;
