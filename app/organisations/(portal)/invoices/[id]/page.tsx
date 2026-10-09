import type { Metadata } from "next";
import Link from "next/link";
import InvoiceDocument from "@/components/organisations/InvoiceDocument";
import PrintButton from "@/components/organisations/PrintButton";
import { orgRead } from "@/lib/organisations/portal";
import type { Invoice } from "@/lib/organisations/types";

export const metadata: Metadata = { title: "Invoice" };
export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { invoice } = await orgRead<{ invoice: Invoice }>(`/v1/organisations/me/invoices/${encodeURIComponent(id)}`);
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/organisations/invoices" className="focus-ring inline-flex min-h-11 items-center text-sm font-semibold text-racing-green underline">
          ← All invoices
        </Link>
        <PrintButton />
      </div>
      <InvoiceDocument invoice={invoice} />
    </>
  );
}
