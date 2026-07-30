import Link from 'next/link';

export const metadata = {
  title: 'Terms and Conditions | Newdryve',
  description: 'Terms and conditions for using Newdryve.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/terms' },
};

const sections = [
  ['1. About these terms', 'These terms apply when you access or use Newdryve, including our mobile app, website, booking tools, payment features, notifications, messages, live tracking, progress tools and related services. By creating an account, signing in, making or accepting a booking, using Newdryve as an instructor, or otherwise using the service, you agree to these terms.'],
  ['2. What Newdryve does', 'Newdryve helps learner drivers find driving instructors, request and manage lessons, store lesson records, track progress, message instructors, receive notifications, manage payments and view related account information. Unless we expressly state otherwise, driving lessons are provided by independent driving instructors or driving schools, not by Newdryve.'],
  ['3. Eligibility', 'Students must be eligible to take driving lessons and must hold any licence, provisional licence or other permission required by law. Instructors must hold all licences, approvals, registrations, insurance, vehicle standards and legal permissions required to provide driving lessons.'],
  ['4. Accounts', 'You must provide accurate account information and keep it up to date. Instructor accounts are created, approved or enabled by Newdryve or authorised administrators. Students cannot turn a student account into an instructor account through ordinary signup.'],
  ['5. Bookings', 'Student accounts must have a valid saved payment card before requesting or booking any lesson. A booking request is not guaranteed until it is accepted or confirmed in the app or by the instructor.'],
  ['6. Payments', 'Adding a card does not mean you are charged when you book. Nothing is charged at the time a booking request is made. At the end of a lesson, the instructor records how the lesson was paid. They may charge the saved card through Newdryve, or mark the lesson as paid by cash or bank transfer. Cash and bank-transfer payments are settled directly with the instructor and recorded in Newdryve by the instructor.'],
  ['7. Instructor payouts and fees', 'Instructor payouts are processed through Stripe Connect and may require a connected payout account. Newdryve currently charges no platform fee on lesson payments processed through the implemented payment flow. Stripe processing fees and other payment-provider deductions may be deducted before instructor payout.'],
  ['8. Cancellations, rescheduling and no-shows', 'Cancelling more than 24 hours before the lesson is free unless the app or instructor clearly says otherwise before booking. Cancelling within 24 hours may result in a cancellation charge of 50% of the lesson price. A no-show may lead to a charge up to the full lesson price where permitted.'],
  ['9. Refunds and disputes', 'Refunds may depend on lesson status, payment method, instructor evidence, cancellation timing and applicable consumer rights. If you believe a charge is incorrect, contact us promptly with booking details and the reason for the dispute.'],
  ['10. Safety and instructor responsibilities', 'Students must be fit and legally allowed to drive at the time of each lesson. Instructors are responsible for their availability, pricing, lesson types, lesson delivery, vehicle, insurance, qualifications, records and tax obligations.'],
  ['11. Location and live tracking', 'Newdryve may use location information for pickup points, distance estimates, live lesson tracking, route context, safety features and booking records. You must not rely on live tracking as an emergency, safety or navigation service.'],
  ['12. Messages, progress and reviews', 'You must communicate respectfully and only for legitimate lesson, account, support or safety purposes. Progress information is for learning support only and is not a guarantee that a student is ready for a test or will pass. Reviews must be honest, fair, relevant and based on genuine experience.'],
  ['13. Tools and third-party services', 'Newdryve may provide calendar feeds, exports, statements, receipts, expense recording, receipt scanning and AI-generated summaries. These tools are provided for convenience. Newdryve may rely on third-party services such as Stripe, mapping providers, notification providers, authentication providers, hosting services and app stores.'],
  ['14. Account deletion and privacy', 'You may request or use available tools to delete your account. We may retain records where necessary for legal, regulatory, tax, fraud prevention, payment, dispute, security or legitimate business purposes. Our use of personal data is described in our Privacy Policy.'],
  ['15. Acceptable use', 'You must not use Newdryve unlawfully, fraudulently, abusively or in a way that harms other users, Newdryve or the public. You must not bypass security, interfere with payments, impersonate others, harass users, misuse personal data or arrange fraudulent bookings.'],
  ['16. Liability and consumer rights', 'Nothing in these terms excludes or limits liability where it would be unlawful to do so. Nothing in these terms affects your statutory rights as a consumer.'],
  ['17. Changes, governing law and contact', 'We may update these terms from time to time. These terms are governed by the laws of England and Wales. Questions, complaints, cancellation disputes, refund requests and support queries should be sent to support@newdryve.com.'],
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
          <strong className="text-ink">Operator:</strong> NEWDRYVE LTD, trading as Newdryve. Company number 17234490. Registered office: 10 Greylag Close, Norwich, United Kingdom, NR7 8FQ. Contact <a href="mailto:support@newdryve.com" className="font-semibold text-ink underline underline-offset-2">support@newdryve.com</a>.
        </p>

        <div className="mt-10 space-y-8">
          {sections.map(([title, body]) => (
            <section key={title}>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.3px] text-ink">{title}</h2>
              <p className="mt-3 text-base leading-relaxed text-ink-secondary">{body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
