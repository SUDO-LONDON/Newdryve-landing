import type { Metadata } from "next";
import { Body, Note, PrimaryLink, Shell } from "@/components/instructor/Shell";

export const metadata: Metadata = {
  title: "Instructor payout setup",
  description: "Use your secure Newdryve email link to connect your Stripe payout account.",
  robots: { index: false, follow: false },
};

/** Where someone lands with no token — the link itself is the credential. */
export default function InstructorSetupPage() {
  return (
    <Shell eyebrow="Instructor setup" title="Use your secure payout link">
      <Body>
        Stripe Connect setup happens online through your private Newdryve email link. That link
        opens a secure Stripe form for your bank details inside Newdryve.
      </Body>
      <PrimaryLink href="mailto:support@newdryve.com?subject=Resend%20Stripe%20Connect%20setup%20link">
        Ask support to resend link
      </PrimaryLink>
      <Note>
        Need help? Email{" "}
        <a className="font-semibold underline" href="mailto:support@newdryve.com">
          support@newdryve.com
        </a>
        .
      </Note>
    </Shell>
  );
}
