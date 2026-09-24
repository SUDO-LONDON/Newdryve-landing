"use client";

import type { ListingReview } from "@/lib/instructor/backend";

function value(text: string | null | undefined) {
  return text?.trim() || "Not provided";
}

function join(items: string[]) {
  return items.length ? items.join(", ") : "Not provided";
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <dt className="text-xs font-bold uppercase tracking-[0.5px] text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-ink">{children}</dd>
    </div>
  );
}

export function ReviewStep({
  review,
  busy,
  ready,
  listed,
  error,
  onConfirm,
  onRefresh,
}: {
  review: ListingReview;
  busy: boolean;
  ready: boolean;
  listed: boolean;
  error: string | null;
  onConfirm: () => void;
  onRefresh: () => void;
}) {
  const car = [review.car_color, review.car_make, review.car_model].filter(Boolean).join(" ");
  const area = review.coverage_value != null && review.coverage_mode
    ? `${review.coverage_value} ${review.coverage_mode}`
    : "Not provided";

  return (
    <section aria-labelledby="listing-review-title" className="mt-6 rounded-2xl border border-racing-green bg-white p-6 shadow-[0_20px_50px_-30px_rgba(10,10,20,0.22)] sm:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[1px] text-racing-green">Final review</p>
      <h2 id="listing-review-title" className="font-display mt-2 text-2xl text-ink">{listed ? "Your listing is live" : "Review your listing"}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-secondary">
        {listed
          ? "Learners can find you in your service area and request bookings. These are the details they see."
          : ready
            ? "These details are what learners will see. Confirming will make you visible in your service area and ready to receive bookings."
            : "Check the details learners will see. Confirmation opens once payouts, your service area and Newdryve’s approval are ready."}
      </p>

      <dl className="mt-5 rounded-xl border border-border px-4 sm:px-5">
        <Detail label="Name">{value(review.display_name)}</Detail>
        <Detail label="About you">{value(review.bio)}</Detail>
        <Detail label="Hourly price">{review.price_per_hour_pence == null ? "Not provided" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(review.price_per_hour_pence / 100)}</Detail>
        <Detail label="Transmission">{join(review.transmissions)}</Detail>
        <Detail label="Languages">{join(review.languages)}</Detail>
        <Detail label="Specialisms">{join(review.specialisms)}</Detail>
        <Detail label="Car">{value(car)}</Detail>
        <Detail label="Service city">{value(review.service_city)}</Detail>
        <Detail label="Test centres">{review.centres.length ? review.centres.map((centre) => `${centre.name}, ${centre.city}`).join(" · ") : "Not provided"}</Detail>
        <Detail label="Travel area">{area} from your test centres</Detail>
      </dl>

      <p className="mt-5 text-sm leading-6 text-ink-secondary">
        Need to correct anything? Email <a className="font-semibold underline" href="mailto:support@newdryve.com?subject=Instructor%20listing%20correction">support@newdryve.com</a>{listed ? "." : " before you go live."}
      </p>
      {error ? <p role="alert" className="mt-4 text-sm text-rose-800">{error}</p> : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {ready ? (
          <button type="button" onClick={onConfirm} disabled={busy} className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">
            {busy ? "Confirming…" : "Confirm and go live"}
          </button>
        ) : null}
        {!listed ? (
          <button type="button" onClick={onRefresh} disabled={busy} className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-racing-green underline">
            Check status now
          </button>
        ) : null}
      </div>
    </section>
  );
}
