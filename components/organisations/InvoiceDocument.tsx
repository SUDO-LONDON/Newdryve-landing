/**
 * The invoice itself, Newdryve-branded for now. Designed to print on one A4
 * page from the browser ("Save as PDF" gives the school a file to keep).
 * Everything shown comes from the frozen copy on the invoice row, so it reads
 * the same however the school's terms change later.
 */

import type { Invoice } from "@/lib/organisations/types";
import { day, gbp, hours, londonDateOf, longDate, sortCode, time } from "@/lib/organisations/format";
import { describeRateCard, percentLabel } from "@/lib/organisations/fees";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function quantity(invoice: Invoice): { qty: string; rate: string } {
  const t = invoice.terms;
  switch (t.fee_mode) {
    case "lead_percent":
      // The basis is what the billed lessons collected, net of refunds.
      return { qty: gbp(invoice.revenue_pence), rate: percentLabel(t.percent_bps) };
    case "lead_fixed":
      return { qty: plural(invoice.lessons, "lesson"), rate: `${gbp(t.amount_pence ?? 0)} / lesson` };
    case "flat_weekly":
      return { qty: "1 week", rate: `${gbp(t.amount_pence ?? invoice.amount_pence)} / week` };
    case "rate_card":
      return { qty: hours(invoice.lesson_minutes), rate: "Rate card" };
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
  const lead = t.fee_mode === "lead_percent" || t.fee_mode === "lead_fixed";
  const perLesson = lead || t.fee_mode === "rate_card";
  const lines = invoice.line_items ?? [];

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
                {day(invoice.period_start)} – {day(invoice.period_end)} ·{" "}
                {/* For a lead fee these count only the billed lessons, with
                    learners the school introduced. */}
                {lead ? `${plural(invoice.lessons, "lesson")} with learners introduced by ${t.organisation_name}` : plural(invoice.lessons, "lesson")},{" "}
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

      {perLesson && lines.length ? <LineItems invoice={invoice} /> : null}

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

/**
 * One row per billed lesson, so an instructor can check a lead-fee invoice
 * against their own diary. The API rounds each line on its own, so the fees
 * add up to the total exactly.
 */
function LineItems({ invoice }: { invoice: Invoice }) {
  const lines = invoice.line_items ?? [];
  const percent = invoice.terms.fee_mode === "lead_percent";
  const card = invoice.terms.fee_mode === "rate_card" ? invoice.terms.rate_card ?? null : null;
  const totalFee = lines.reduce((n, l) => n + l.fee_pence, 0);
  return (
    <section className="mt-8" aria-labelledby={`lines-${invoice.id}`}>
      <h2 id={`lines-${invoice.id}`} className="text-sm font-bold">
        Lessons billed
      </h2>
      <p className="mt-1 text-xs text-ink-secondary">
        {card
          ? describeRateCard(card)
          : percent
          ? `${percentLabel(invoice.terms.percent_bps)} of what each lesson collected, after any refund.`
          : `${gbp(invoice.terms.amount_pence ?? 0)} for each completed lesson. What the lesson collected is shown for reference.`}
      </p>
      <table className="mt-3 w-full text-left text-sm">
        <thead className="border-y border-border text-[11px] uppercase tracking-[1px] text-ink-secondary">
          <tr>
            <th scope="col" className="py-2 pr-3">Date</th>
            <th scope="col" className="py-2 pr-3 text-right">Minutes</th>
            {card ? <th scope="col" className="py-2 pr-3">How</th> : null}
            <th scope="col" className="py-2 pr-3 text-right">{percent ? "Basis" : "Collected"}</th>
            <th scope="col" className="py-2 text-right">Fee</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.booking_id} className="border-b border-border">
              <td className="py-2 pr-3">
                {day(londonDateOf(line.starts_at))}
                <span className="text-ink-secondary"> · {time(line.starts_at)}</span>
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">{line.minutes}</td>
              {card ? <td className="py-2 pr-3 text-xs text-ink-secondary">{line.note ?? ""}</td> : null}
              <td className="py-2 pr-3 text-right tabular-nums">{gbp(line.basis_pence)}</td>
              <td className="py-2 text-right font-semibold tabular-nums">{gbp(line.fee_pence)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={card ? 4 : 3} className="pt-2 pr-3 text-right text-xs font-bold text-ink-secondary">
              {plural(lines.length, "lesson")}
            </td>
            <td className="pt-2 text-right font-bold tabular-nums">{gbp(totalFee)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
