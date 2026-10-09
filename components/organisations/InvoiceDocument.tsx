/**
 * The invoice itself, Newdryve-branded for now. Designed to print on one A4
 * page from the browser ("Save as PDF" gives the school a file to keep).
 * Everything shown comes from the frozen copy on the invoice row, so it reads
 * the same however the school's terms change later.
 */

import type { Invoice } from "@/lib/organisations/types";
import { day, gbp, hours, longDate, sortCode } from "@/lib/organisations/format";

function quantity(invoice: Invoice): { qty: string; rate: string } {
  const t = invoice.terms;
  switch (t.fee_mode) {
    case "per_hour":
      return { qty: hours(invoice.lesson_minutes), rate: `${gbp(t.amount_pence ?? 0)} / hour` };
    case "per_lesson":
      return { qty: `${invoice.lessons} lesson${invoice.lessons === 1 ? "" : "s"}`, rate: `${gbp(t.amount_pence ?? 0)} / lesson` };
    case "percent_of_revenue":
      return { qty: gbp(invoice.revenue_pence), rate: `${((t.percent_bps ?? 0) / 100).toFixed(2).replace(/\.00$/, "")}%` };
    default:
      return { qty: "1 week", rate: gbp(t.amount_pence ?? invoice.amount_pence) };
  }
}

export default function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  const t = invoice.terms;
  const { qty, rate } = quantity(invoice);

  return (
    <article className="mx-auto w-full max-w-[820px] overflow-hidden rounded-2xl border border-border bg-white p-6 text-ink sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
        <div>
          <p className="text-2xl font-extrabold leading-none" translate="no">
            <span className="text-racing-green">newdr</span>
            <span className="text-deep-rose">y</span>
            <span className="text-racing-green">ve</span>
          </p>
          <p className="mt-4 text-sm font-bold text-ink">{t.from_name}</p>
          {t.from_address ? <p className="whitespace-pre-line text-sm text-ink-secondary">{t.from_address}</p> : null}
        </div>
        <div className="sm:text-right">
          <p className="font-display text-3xl">Invoice</p>
          <p className="mt-1 text-sm font-semibold text-ink">{invoice.number}</p>
          {invoice.status !== "issued" ? (
            <p
              className={`mt-3 inline-block rotate-[-6deg] rounded-lg border-[3px] px-3 py-0.5 text-xl font-black uppercase tracking-widest ${
                invoice.status === "paid" ? "border-racing-green text-racing-green" : "border-ink-secondary text-ink-secondary"
              }`}
            >
              {invoice.status === "paid" ? "Paid" : "Void"}
            </p>
          ) : null}
        </div>
      </header>

      <dl className="grid gap-4 py-6 text-sm sm:grid-cols-4">
        <div className="sm:col-span-2">
          <dt className="text-[11px] font-bold uppercase tracking-[1px] text-ink-secondary">Billed to</dt>
          <dd className="mt-1 font-semibold">{t.instructor_name}</dd>
          <dd className="text-ink-secondary">Instructor, {t.organisation_name}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[1px] text-ink-secondary">Issued</dt>
          <dd className="mt-1">{longDate(invoice.issued_at)}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[1px] text-ink-secondary">Due</dt>
          <dd className="mt-1 font-semibold">{longDate(invoice.due_on)}</dd>
        </div>
      </dl>

      <table className="w-full text-left text-sm">
        <thead className="border-y border-border text-[11px] uppercase tracking-[1px] text-ink-secondary">
          <tr>
            <th scope="col" className="py-2.5 pr-3">Description</th>
            {/* The description already says "3h 30m at £5.00 per hour"; on a
                phone the separate columns only squeeze it. */}
            <th scope="col" className="hidden py-2.5 pr-3 text-right sm:table-cell">Quantity</th>
            <th scope="col" className="hidden py-2.5 pr-3 text-right sm:table-cell">Rate</th>
            <th scope="col" className="py-2.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border align-top">
            <td className="py-3 pr-3">
              <p className="font-semibold">{t.description}</p>
              <p className="text-xs text-ink-secondary">
                {day(invoice.period_start)} – {day(invoice.period_end)} · {invoice.lessons} lesson{invoice.lessons === 1 ? "" : "s"},{" "}
                {hours(invoice.lesson_minutes)} taught
              </p>
            </td>
            <td className="hidden py-3 pr-3 text-right sm:table-cell">{qty}</td>
            <td className="hidden py-3 pr-3 text-right sm:table-cell">{rate}</td>
            <td className="py-3 text-right font-semibold">{gbp(invoice.amount_pence)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="hidden sm:table-cell" />
            <td className="pt-4 pr-3 text-right font-bold">Total due</td>
            <td className="pt-4 text-right font-display text-2xl">{gbp(invoice.amount_pence)}</td>
          </tr>
        </tfoot>
      </table>

      <section className="mt-8 rounded-xl bg-canvas p-5 text-sm print:border print:border-border print:bg-white">
        <h2 className="font-bold">Pay by bank transfer</h2>
        {t.bank ? (
          <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-ink-secondary">Account name</dt>
              <dd className="font-semibold">{t.bank.account_name}</dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-ink-secondary">Sort code</dt>
              <dd className="font-semibold">{sortCode(t.bank.sort_code)}</dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-ink-secondary">Account number</dt>
              <dd className="font-semibold">{t.bank.account_number}</dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-ink-secondary">Reference</dt>
              <dd className="font-semibold">{invoice.number}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-ink-secondary">{t.organisation_name} will confirm how to pay.</p>
        )}
        <p className="mt-3 text-xs text-ink-secondary">Payment due within {t.payment_terms_days} days of the invoice date.</p>
      </section>

      {t.notes ? <p className="mt-6 whitespace-pre-line text-sm text-ink-secondary">{t.notes}</p> : null}

      <footer className="mt-10 border-t border-border pt-4 text-xs text-ink-secondary">
        Issued by {t.organisation_name} through Newdryve · newdryve.com
      </footer>
    </article>
  );
}
