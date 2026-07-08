import { InstructorOnboardingForm } from '@/components/admin/InstructorOnboardingForm';

export const metadata = {
  title: 'Instructor onboarding · Newdryve',
  robots: { index: false, follow: false },
};

export default function AdminOnboardingPage() {
  return (
    <main className="min-h-screen bg-canvas px-4 py-12 sm:py-16">
      <div className="max-w-xl mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-[1px] text-deep-rose mb-3">
          Founding instructor application
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
          Onboard a new instructor
        </h1>
        <p className="text-sm text-ink-secondary mb-8">
          Collect details and verification documents. We&rsquo;ll review the application and
          follow up directly &mdash; nothing here creates an account automatically.
        </p>
        <InstructorOnboardingForm />
      </div>
    </main>
  );
}
