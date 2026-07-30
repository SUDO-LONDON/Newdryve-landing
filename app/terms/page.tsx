import Link from 'next/link';

export const metadata = {
  title: 'Terms and Conditions | Newdryve',
  description: 'Terms and conditions for using Newdryve.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/terms' },
};

const sections = [
  {
    title: '1. About These Terms',
    body: [
      'These Terms and Conditions apply when you access or use Newdryve, including our mobile app, website, booking tools, payment features, notifications, messages, live tracking, progress tools and related services.',
      'By creating an account, signing in, making a booking, accepting a booking, using Newdryve as an instructor or otherwise using the service, you agree to these Terms.',
      'If you do not agree to these Terms, you must not create an account or use Newdryve.',
    ],
  },
  {
    title: '2. Who We Are',
    body: [
      'Newdryve is operated by NEWDRYVE LTD, trading as NewDryve. NEWDRYVE LTD is a company registered in England and Wales with company number 17234490.',
      'Our registered office is 10 Greylag Close, Norwich, NR7 8FQ, England.',
      'You can contact us at support@newdryve.com.',
    ],
  },
  {
    title: '3. What Newdryve Does',
    body: [
      'Newdryve helps learner drivers find driving instructors, request and manage lessons, store lesson records, track progress, message instructors, receive notifications, manage payments and view related account information.',
      'Unless we expressly state otherwise, driving lessons are provided by independent driving instructors or driving schools, not by Newdryve. Newdryve provides the platform that helps students and instructors arrange and manage those services.',
      'We are not responsible for the actual driving instruction, vehicle, licence status, insurance, conduct or professional obligations of an instructor, except where the law says we cannot exclude responsibility.',
    ],
  },
  {
    title: '4. Eligibility',
    body: [
      'You must be legally able to enter into these Terms and use the service in the United Kingdom.',
      'Students must be eligible to take driving lessons and must hold any licence, provisional licence or other permission required by law for the lesson they book.',
      'If you are under 18, you confirm that a parent or guardian has agreed to your use of Newdryve and to any payments, cancellation charges or bookings made through your account.',
      'Instructors must hold all licences, approvals, registrations, insurance, vehicle standards and legal permissions required to provide driving lessons.',
    ],
  },
  {
    title: '5. Accounts',
    body: [
      'You must provide accurate account information and keep it up to date.',
      'You are responsible for keeping your login details secure and for activity on your account.',
      "You must not share your account with someone else or create an account using another person's details without permission.",
      'We may refuse, suspend or close an account where we reasonably believe these Terms have been breached, the account is unsafe, the account is fraudulent, or doing so is needed to protect Newdryve, users or the public.',
    ],
  },
  {
    title: '6. Student Accounts',
    body: [
      'Student accounts are for learners who want to find instructors, book lessons and manage their learning.',
      'When you request a lesson, you are responsible for checking that the instructor, lesson type, price, location, date and time are suitable before confirming.',
      'You must be fit and legally allowed to drive at the time of each lesson. You must not attend a lesson under the influence of alcohol, drugs or anything else that may affect your ability to drive safely.',
      'Your instructor may refuse or stop a lesson if they reasonably believe it would be unsafe or unlawful to continue.',
    ],
  },
  {
    title: '7. Instructor Accounts',
    body: [
      'Instructor accounts are for approved instructors, driving schools and authorised administrators.',
      'Instructor accounts are created, approved or enabled by Newdryve or by authorised administrators. Students cannot turn a student account into an instructor account through ordinary signup.',
      'Instructors are responsible for their availability, pricing, lesson types, lesson delivery, vehicle, insurance, qualifications, records and tax obligations.',
      'Instructors must keep calendar, pricing, service area, payout and profile details accurate so students receive reliable information.',
      'Newdryve may promote approved instructors through the app, website, marketing activity and related channels, but we do not guarantee any minimum number of views, enquiries, bookings, learners, income or results.',
    ],
  },
  {
    title: '8. Bookings',
    body: [
      'Student accounts must have a valid saved payment card before requesting or booking any lesson.',
      'A booking request is not guaranteed until it is accepted or confirmed in the app or by the instructor.',
      'Booking information shown in Newdryve may include lesson type, duration, price, pickup address, timing, instructor details and booking status.',
      'You must check booking details carefully. If something is wrong, you should contact the instructor or Newdryve as soon as possible.',
      'We may need to cancel, amend or refuse a booking where there is a pricing mistake, technical error, safety concern, suspected misuse, instructor unavailability or legal requirement.',
    ],
  },
  {
    title: '9. Payments',
    body: [
      'Students must add a valid payment card through Stripe before they can request or book lessons. Card details are handled by Stripe and Newdryve stores only payment references and limited card details such as brand and last four digits where needed.',
      'Adding a card does not mean you are charged when you book. Nothing is charged at the time a booking request is made.',
      'At the end of a lesson, the instructor records how the lesson was paid. They may charge the saved card through Newdryve, or mark the lesson as paid by cash or bank transfer.',
      "When bank transfer is selected, Newdryve may show the instructor's configured bank transfer details to the student. Instructors are responsible for keeping those details accurate.",
      'By adding a card and requesting or booking a lesson, you authorise Newdryve and Stripe to charge that card, including off-session where permitted, when the instructor selects card payment at the end of a lesson, for late-cancellation fees, for no-show fees, for failed-payment retries and for other payments you approve in the app.',
      'Card payments, instructor subscriptions, Stripe Connect onboarding, card storage and related payment-provider functions are handled through Stripe. Cash and bank-transfer payments are settled directly between the student and instructor and are recorded in Newdryve by the instructor.',
      'Some payments may require bank authentication, including 3D Secure or other strong customer authentication steps.',
      'If a payment fails, you must update your payment method promptly. We may prevent new bookings, restrict payment-related features, retry payment where permitted by law and by the payment provider, or take reasonable steps to recover amounts due.',
    ],
  },
  {
    title: '10. Instructor Payouts And Fees',
    body: [
      'Instructor payouts are processed through the configured payment provider and may require a connected payout account.',
      'Newdryve currently charges no platform fee on lesson payments processed through the implemented payment flow.',
      'Stripe processing fees and other payment-provider deductions may be deducted before instructor payout.',
      'Founding and launch instructors currently pay a subscription fee of £29 per month after any agreed free trial or introductory period, unless Newdryve has agreed different written terms with that instructor.',
      'Newdryve may offer selected instructors a free trial, including a one-month free trial from account activation. Free trials are discretionary, may be changed or withdrawn, and do not guarantee any bookings, learners, income or enquiries.',
      "After a free trial ends, the instructor subscription renews at the applicable monthly fee unless cancelled before renewal. Newdryve may change instructor subscription pricing by giving at least 30 days' notice. Any price change will not affect fees already paid.",
      'If Newdryve introduces or changes a platform fee for instructors or driving schools, the applicable fee should be disclosed before it applies.',
      'Instructors are responsible for checking payout information and for any tax, accounting or business records linked to income received through or recorded in Newdryve.',
    ],
  },
  {
    title: '11. Cancellations And Rescheduling',
    body: [
      'Students can usually cancel or request to reschedule a lesson through the app.',
      'Cancelling more than 24 hours before the lesson is free unless the app or instructor clearly says otherwise before booking.',
      'Cancelling within 24 hours of the lesson may result in a cancellation charge of 50% of the lesson price, paid to the instructor.',
      'Instructors may cancel or reschedule where needed because of illness, vehicle problems, safety, weather, legal restrictions, emergencies or other reasonable causes. A student will not be charged a cancellation fee where the instructor cancels the lesson.',
      "An instructor may choose not to enforce a student late-cancellation charge, but this is at the instructor's discretion unless Newdryve decides otherwise after reviewing a complaint or dispute.",
      'Repeated cancellations, late cancellations or misuse may lead to account restrictions.',
    ],
  },
  {
    title: '12. No-Shows',
    body: [
      'If a student does not attend, is not at the agreed pickup point, is not legally allowed to drive, or cannot safely take the lesson, the instructor may mark the lesson as a no-show or unable to proceed.',
      'A no-show may lead to a charge up to the full lesson price where permitted.',
      'If an instructor does not attend or cannot provide the lesson, the student should report the issue through Newdryve or contact support.',
    ],
  },
  {
    title: '13. Refunds And Disputes',
    body: [
      'Refunds may depend on the lesson status, payment method, instructor evidence, cancellation timing and applicable consumer rights.',
      'If you believe a charge is incorrect or you want to submit a complaint, contact support@newdryve.com promptly with the booking details and the reason for the dispute.',
      'We may ask students and instructors for evidence such as messages, timestamps, location records, lesson notes or booking history.',
      'Newdryve will review complaints and disputes and decide the outcome reasonably based on the available information, applicable law, payment-provider rules and these Terms.',
      "Chargebacks or payment disputes made through a bank or payment provider may be handled under that provider's rules.",
    ],
  },
  {
    title: '14. Location And Live Tracking',
    body: [
      'Newdryve may use location information for pickup points, distance estimates, live lesson tracking, route context, safety features and booking records.',
      'Live tracking depends on device permissions, network availability and instructor participation. It may be delayed, unavailable or inaccurate.',
      'You must not rely on live tracking as an emergency, safety or navigation service.',
      'You can manage device location permissions through your device settings.',
    ],
  },
  {
    title: '15. Messages, Calls And Notifications',
    body: [
      'Newdryve may let students, instructors and administrators send messages, receive booking updates, receive payment alerts and contact each other about lessons.',
      'You must communicate respectfully and only for legitimate lesson, account, support or safety purposes.',
      'Notifications may be sent by push notification, email, SMS or in-app message where enabled. Delivery is not guaranteed.',
      'You are responsible for keeping contact details current so important booking and payment messages can reach you.',
    ],
  },
  {
    title: '16. Progress, Notes And AI Summaries',
    body: [
      'Instructors may record lesson notes, skill progress, mock test information and learning feedback in Newdryve.',
      'Newdryve may generate summaries or insights from lesson records. AI-generated or automated summaries may be incomplete, inaccurate or out of date.',
      'Progress information is for learning support only and is not a guarantee that a student is ready for a test, will pass a test or meets any legal driving standard.',
      'Instructors and students should use their own judgement and, where relevant, official DVSA guidance.',
    ],
  },
  {
    title: '17. Reviews',
    body: [
      'Students may be able to review instructors after lessons.',
      'Reviews must be honest, fair, relevant and based on genuine experience.',
      'We may moderate, remove or restrict reviews that are abusive, misleading, unlawful, irrelevant, fraudulent, discriminatory, private or otherwise unsuitable.',
      "Reviews are opinions of users and do not represent Newdryve's own statements unless we expressly say so.",
    ],
  },
  {
    title: '18. Calendar Feeds And Exports',
    body: [
      'Newdryve may provide calendar feeds, booking exports, statements, receipts or other downloadable records.',
      'Calendar feeds can reveal lesson times, locations and student or instructor information to anyone who has the feed link. You must keep calendar feed links private and revoke them if they may have been shared.',
      'Exports are provided for convenience and record-keeping. You should check exported information before relying on it for tax, accounts or formal records.',
    ],
  },
  {
    title: '19. Expenses And Receipt Scanning',
    body: [
      'Instructor features may include expense recording, receipt uploads and receipt scanning.',
      'Receipt scanning and categorisation may be automated and may be inaccurate. Instructors remain responsible for checking entries and keeping any legally required records.',
      'Newdryve does not provide tax, accounting or financial advice.',
    ],
  },
  {
    title: '20. Administrator Access',
    body: [
      'Authorised administrators or super administrators may be able to manage tenants, instructors, lesson types, fees, support issues, disputes, account status and operational records.',
      'Administrators must use access only for legitimate business, support, safety, compliance or operational purposes.',
      'Misuse of administrator access may lead to account removal and further action.',
    ],
  },
  {
    title: '21. Account Deletion',
    body: [
      'You may request or use available tools to delete your account.',
      'Account deletion may cancel upcoming lessons, remove or anonymise profile details and restrict access to the app.',
      'We may retain records where necessary for legal, regulatory, tax, fraud prevention, payment, dispute, security or legitimate business purposes.',
      'Deleted accounts may not be recoverable.',
    ],
  },
  {
    title: '22. Acceptable Use',
    body: [
      'You must not use Newdryve unlawfully, fraudulently, abusively or in a way that harms other users, Newdryve or the public.',
      'You must not attempt to bypass security, scrape the service, reverse engineer the app, interfere with payments, upload malicious content, impersonate others, harass users, misuse personal data or arrange fraudulent bookings.',
      'You must not use Newdryve to promote unsafe driving, illegal driving, discrimination, abuse or conduct that would put people at risk.',
    ],
  },
  {
    title: '23. Third-Party Services',
    body: [
      'Newdryve may rely on third-party services such as payment providers, mapping providers, notification providers, authentication providers, analytics, hosting services, app stores and calendar tools.',
      'Those third-party services may have their own terms and privacy notices.',
      'We are not responsible for third-party services that we do not control, but we will use reasonable care when choosing services that support Newdryve.',
    ],
  },
  {
    title: '24. Availability And Changes To The Service',
    body: [
      'We aim to keep Newdryve available, secure and useful, but we do not guarantee that it will always be uninterrupted, error-free or available on every device.',
      'We may change, suspend, remove or update features for legal, security, operational, commercial or product reasons.',
      'We may release updates that you need to install to keep using the service properly.',
    ],
  },
  {
    title: '25. Intellectual Property',
    body: [
      'Newdryve, including its software, brand, design, text, graphics, data structures and other materials, belongs to Newdryve or its licensors.',
      'You may use Newdryve only for the purposes allowed by these Terms.',
      'You must not copy, modify, distribute, sell, rent, exploit or create derivative works from Newdryve except where we have given permission or the law allows it.',
    ],
  },
  {
    title: '26. Privacy',
    body: [
      'Our use of personal data is described in our Privacy Policy.',
      'By using Newdryve, you understand that we may process information needed to run the service, including account details, booking information, payment references, messages, notifications, location information, lesson records and support information.',
      'You should read the Privacy Policy alongside these Terms.',
    ],
  },
  {
    title: '27. Suspension And Termination',
    body: [
      'We may suspend, restrict or terminate access where we reasonably believe there has been a breach of these Terms, misuse, fraud, non-payment, safety risk, legal risk, security issue or unacceptable conduct.',
      'You may stop using Newdryve at any time, subject to any bookings, payments, cancellation charges or obligations already incurred.',
      'Terms that by their nature should continue after termination will continue, including payment obligations, liability limits, dispute terms, intellectual property rights and record retention terms.',
    ],
  },
  {
    title: '28. Liability',
    body: [
      'Nothing in these Terms excludes or limits liability where it would be unlawful to do so, including liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation.',
      'To the fullest extent permitted by law, Newdryve is not liable for losses caused by independent instructors, driving schools, user conduct, inaccurate user information, unavailable third-party services, device issues, network issues or events outside our reasonable control.',
      'We are not liable for indirect, consequential or business losses, including lost profit, lost revenue, lost opportunity, loss of goodwill or business interruption.',
      'Where we are legally responsible to a consumer, our liability will be limited to losses that were reasonably foreseeable when you accepted these Terms.',
    ],
  },
  {
    title: '29. Consumer Rights',
    body: [
      'Nothing in these Terms affects your statutory rights as a consumer.',
      'Where consumer law gives you rights that cannot be excluded, those rights continue to apply.',
      'Because driving lessons are services arranged for a specific date or time, cancellation and refund rights may differ from ordinary online purchases once a booking is made, a lesson is due to start, or a lesson has been supplied.',
    ],
  },
  {
    title: '30. Changes To These Terms',
    body: [
      'We may update these Terms from time to time.',
      'If changes are material, we will take reasonable steps to tell you through the app, by email or by another appropriate method.',
      'The version shown in the app when you create an account or continue using Newdryve is the version that applies from that point.',
    ],
  },
  {
    title: '31. Governing Law And Courts',
    body: [
      'These Terms are governed by the laws of England and Wales.',
      'If you are a consumer living elsewhere in the United Kingdom, you may also have the right to bring proceedings in your local courts.',
      'We will try to resolve complaints fairly before any court action is needed.',
    ],
  },
  {
    title: '32. Contact',
    body: [
      'Questions, complaints, cancellation disputes, refund requests and support queries should be sent to support@newdryve.com.',
      'Please include your account email, booking details and a short explanation so we can investigate efficiently.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="bg-canvas text-ink min-h-screen">
      <main className="max-w-3xl mx-auto px-5 py-16 md:py-24">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-secondary hover:text-ink motion-safe:transition-colors">
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M9.5 6h-7M6 2.5 2.5 6 6 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to home
        </Link>

        <h1 className="font-display mt-6 text-[clamp(32px,5vw,48px)] font-semibold tracking-[-1px] leading-[1.05]">
          Terms and Conditions
        </h1>
        <p className="mt-4 text-sm text-ink-secondary">Version 2026-07-30. Last updated 30 July 2026.</p>
        <p className="mt-6 rounded-2xl border border-blush-border bg-blush-surface px-5 py-4 text-sm leading-relaxed text-ink-secondary">
          <strong className="text-ink">Operator:</strong> NEWDRYVE LTD, trading as NewDryve. Company number 17234490. Registered office: 10 Greylag Close, Norwich, NR7 8FQ, England. Contact <a href="mailto:support@newdryve.com" className="font-semibold text-ink underline underline-offset-2">support@newdryve.com</a>.
        </p>

        <div className="mt-10 space-y-8">
          {sections.map(({ title, body }) => (
            <section key={title}>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.3px] text-ink">{title}</h2>
              <div className="mt-3 space-y-3">
                {body.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-relaxed text-ink-secondary">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
