import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How NEWDRYVE LTD collects, uses, shares and protects personal data.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/privacy' },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold tracking-[-0.3px] text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-relaxed text-ink-secondary">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="bg-canvas text-ink min-h-screen">
      <main className="max-w-3xl mx-auto px-5 py-16 md:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-secondary hover:text-ink motion-safe:transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M9.5 6h-7M6 2.5 2.5 6 6 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to home
        </Link>

        <h1 className="font-display mt-6 text-[clamp(32px,5vw,48px)] font-semibold tracking-[-1px] leading-[1.05]">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-ink-secondary">Last updated 31 July 2026</p>

        <p className="mt-6 rounded-2xl border border-blush-border bg-blush-surface px-5 py-4 text-sm leading-relaxed text-ink-secondary">
          <strong className="text-ink">Data controller:</strong> NEWDRYVE LTD, trading as Newdryve, company number 17234490. Registered office: 10 Greylag Close, Norwich, NR7 8FQ, England. For privacy questions or requests, email{' '}
          <a href="mailto:support@newdryve.com" className="font-semibold text-ink underline underline-offset-2">support@newdryve.com</a>.
          <span className="mt-2 block">The Newdryve iOS app is published on the App Store by JSDK SAGA LIMITED on behalf of NEWDRYVE LTD.</span>
        </p>

        <div className="mt-10 space-y-8">
          <Section title="1. Scope">
            <p>
              This policy explains how we handle personal data when you use the Newdryve website, join our early-access waitlist, contact us, or use our mobile app and related services. It applies to learner drivers, instructors, driving schools and other people who use or interact with Newdryve.
            </p>
          </Section>

          <Section title="2. Information we collect">
            <p>Depending on how you use Newdryve, we may collect the following information.</p>
            <ul className="list-disc space-y-2 pl-5 marker:text-deep-rose">
              <li><strong className="text-ink">Website and waitlist information:</strong> your email address, name, whether you are a learner or instructor, postcode or area, and any optional notes such as teaching experience or an ADI number.</li>
              <li><strong className="text-ink">Account and profile information:</strong> your name, email address, telephone number, account and authentication identifiers, role, age, driving experience, language preferences, transmission and instructor preferences, and learning goal.</li>
              <li><strong className="text-ink">Lesson and booking information:</strong> availability, instructor profile information, lesson type, date, time, price, pickup address, booking status, cancellations, payment status, lesson notes, learning progress, assessments, reviews and messages.</li>
              <li><strong className="text-ink">Location information:</strong> a pickup address and, if you choose to use the feature, your precise device location. An instructor may also actively share a live vehicle position during a lesson. We do not request background location access.</li>
              <li><strong className="text-ink">Payment and payout information:</strong> payment references, transaction history, limited card details such as brand and last four digits, and instructor bank-transfer or payout details. Stripe handles card details and connected-account onboarding.</li>
              <li><strong className="text-ink">Optional uploads and content:</strong> receipt images, expense details, messages, lesson notes and other content you choose to provide. Receipt images may be processed to extract information when you request scanning.</li>
              <li><strong className="text-ink">Device and technical information:</strong> push-notification token, device platform, security and diagnostic logs, and information needed to keep the service reliable and secure.</li>
            </ul>
          </Section>

          <Section title="3. How we use your information">
            <p>We use personal data to provide and administer Newdryve, including to create accounts, match learners and instructors, manage bookings, process and record payments, enable payouts, send service notifications, provide support, maintain records, prevent fraud, investigate disputes, protect users and improve reliability.</p>
            <p>Where UK data-protection law applies, we rely on the performance of a contract, legal obligations, our legitimate interests in running a safe and reliable service, or your consent where we ask for it. You can change device permissions, such as location, camera, photo-library and notification permissions, in your device settings.</p>
          </Section>

          <Section title="4. Early access and marketing">
            <p>If you join the waitlist or apply as an instructor, we use the information you provide to assess your application and send Newdryve early-access, launch and service updates. You can ask us to stop these messages at any time by emailing <a href="mailto:support@newdryve.com" className="font-semibold text-ink underline underline-offset-2">support@newdryve.com</a>.</p>
            <p>We do not sell personal data, display third-party advertising, or use personal data to track you across other companies&apos; apps or websites.</p>
          </Section>

          <Section title="5. Who we share information with">
            <p>We share the information needed to arrange and deliver a lesson between the relevant learner and instructor. For example, this may include contact details, booking details, pickup location, messages, lesson records and payment status.</p>
            <p>We also use specialist providers to operate Newdryve. They process information only as needed to provide their services to us:</p>
            <ul className="list-disc space-y-2 pl-5 marker:text-deep-rose">
              <li>Supabase, for database, authentication and storage services.</li>
              <li>Railway, for application hosting and operational infrastructure.</li>
              <li>Stripe, for card payments, payment methods, instructor subscriptions and connected-account payouts.</li>
              <li>Expo, for push-notification delivery.</li>
              <li>Twilio, for communications where SMS is enabled.</li>
              <li>Mistral AI, when you request receipt extraction or an AI-generated summary.</li>
              <li>Resend, for website waitlist and service emails.</li>
            </ul>
            <p>We may also share information where required by law, to enforce our rights, respond to a valid legal request, protect people from harm, or obtain professional advice.</p>
          </Section>

          <Section title="6. International transfers and security">
            <p>Some of our providers may process information outside the United Kingdom. Where required, we use recognised transfer mechanisms and contractual safeguards. We use access controls, encryption in transit and database security controls designed to protect personal data. No online service can guarantee absolute security.</p>
          </Section>

          <Section title="7. How long we keep information">
            <p>We keep active account, booking and lesson information while an account is in use. If you delete your account, we remove or anonymise profile information and future bookings where appropriate. We may retain transaction, tax, accounting, payment, dispute, fraud-prevention and security records for as long as required or permitted by law, which may be up to seven years for accounting records.</p>
            <p>We keep waitlist information only for as long as needed to manage early access and launch communications, or until you ask us to stop. Security logs and failed synchronisation records are retained only for as long as reasonably needed for security, reliability and dispute handling.</p>
          </Section>

          <Section title="8. Your rights and choices">
            <p>Depending on the law that applies to you, you may ask for access to your personal data, correction, deletion, restriction, portability, or an objection to certain processing. You may withdraw consent where we rely on it. We may need to verify your identity before acting on a request.</p>
            <p>To make a request, email <a href="mailto:support@newdryve.com" className="font-semibold text-ink underline underline-offset-2">support@newdryve.com</a>. You can also complain to the UK Information Commissioner&apos;s Office if you are unhappy with how we handle your information.</p>
          </Section>

          <Section title="9. Deleting your account">
            <p>You can request account deletion through Account settings in the app, by using our <Link href="/datadeletion" className="font-semibold text-ink underline underline-offset-2">data deletion request form</Link>, or by emailing <a href="mailto:support@newdryve.com" className="font-semibold text-ink underline underline-offset-2">support@newdryve.com</a>. Deleting the app from your device does not delete your Newdryve account.</p>
          </Section>

          <Section title="10. Children">
            <p>Newdryve is not directed to children under 13. Learner drivers under 18 should use the service with a parent or guardian&apos;s awareness, as set out in our <Link href="/terms" className="font-semibold text-ink underline underline-offset-2">Terms and Conditions</Link>.</p>
          </Section>

          <Section title="11. Changes to this policy">
            <p>We may update this policy when our services or legal obligations change. We will publish the updated version here and change the date at the top of this page. If a change is material, we will take reasonable steps to notify affected users.</p>
          </Section>
        </div>
      </main>
    </div>
  );
}
