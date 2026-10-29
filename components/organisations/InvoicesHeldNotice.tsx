import Link from "next/link";

/**
 * A school with no bank details has its invoices held (ADR-060): nothing is
 * raised or emailed until they are added, because an instructor could not pay
 * the invoice. Shown on Settings and Invoices, linking to the bank details form.
 */
const HELD = "are on hold until you add your bank details";

export default function InvoicesHeldNotice({
  organisationId,
  schoolName,
  onSettingsPage = false,
}: {
  organisationId: string;
  /** Named when the admin runs more than one school. */
  schoolName?: string;
  onSettingsPage?: boolean;
}) {
  const href = `${onSettingsPage ? "" : "/organisations/settings"}#bank-${organisationId}`;
  return (
    <div role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-bold">{schoolName ? `${schoolName}: invoices ${HELD}` : `Invoices ${HELD}`}</p>
      <p className="mt-1">
        Instructors aren&rsquo;t sent invoices until they know where to pay you. Once your bank details are saved, invoices go
        out every Monday as usual, and you can raise any week you missed from the Invoices page.
      </p>
      <Link href={href} className="mt-2 inline-flex min-h-11 items-center font-semibold underline">
        Add your bank details
      </Link>
    </div>
  );
}
