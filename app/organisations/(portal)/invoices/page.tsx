import type { Metadata } from "next";
import InvoicesView from "@/components/organisations/InvoicesView";
import { PageHeading } from "@/components/organisations/PortalShell";
import { orgRead } from "@/lib/organisations/portal";
import type { BillingResponse, Invoice } from "@/lib/organisations/types";

export const metadata: Metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const [invoices, billing] = await Promise.all([
    orgRead<{ items: Invoice[] }>("/v1/organisations/me/invoices"),
    orgRead<BillingResponse>("/v1/organisations/me/billing"),
  ]);
  return (
    <>
      <PageHeading eyebrow="Billing" title="Invoices">
        What each instructor owes you each week, paid to you by bank transfer. Mark an invoice paid when the money arrives.
      </PageHeading>
      <InvoicesView initial={invoices.items} billing={billing} />
    </>
  );
}
