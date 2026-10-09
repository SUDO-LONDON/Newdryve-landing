"use client";

/**
 * The details learners will see, and the confirmation that publishes them.
 *
 * Laid out like a profile rather than a form readback: short facts sit side by
 * side so the whole listing fits on roughly one phone screen, and only the bio
 * and lists get a full line.
 */

import type { ListingReview } from "@/lib/instructor/backend";

const TRANSMISSION_LABEL: Record<string, string> = { manual: "Manual", auto: "Automatic", automatic: "Automatic" };

/** £42/hr, not £42.00/hr — pence only when there are some. */
function hourly(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}

function list(items: string[]) {
  return items.length ? items.join(", ") : "Not provided";
}

function Fact({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.5px] text-ink-secondary">{label}</dt>
      <dd className="mt-0.5 text-[15px] leading-6 text-ink sm:text-sm">{children}</dd>
    </div>
  );
}

export function ListingSummary({ review }: { review: ListingReview }) {
  const car = [review.car_color, review.car_make, review.car_model].filter(Boolean).join(" ");
  const area =
    review.coverage_value != null && review.coverage_mode
      ? review.coverage_mode === "minutes"
        ? `${review.coverage_value} minutes' drive from your test centres`
        : `${review.coverage_value} miles from your test centres`
      : "Not set yet";
  // Centre names already carry their town ("Norwich (Peachman Way)"), so the
  // city is only added when the name would otherwise be ambiguous.
  const centres = review.centres.map((centre) =>
    centre.name.toLowerCase().includes(centre.city.toLowerCase()) ? centre.name : `${centre.name}, ${centre.city}`
  );

  return (
    <div className="rounded-xl border border-border p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-base font-bold text-ink">{review.display_name?.trim() || "Name not provided"}</p>
        <p className="shrink-0 text-sm font-semibold text-ink">
          {review.price_per_hour_pence == null ? "Price not set" : `${hourly(review.price_per_hour_pence)}/hr`}
        </p>
      </div>
      <p className="mt-2 text-[15px] leading-6 text-ink-secondary sm:text-sm">{review.bio?.trim() || "No bio provided."}</p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
        <Fact label="Transmission">{list(review.transmissions.map((t) => TRANSMISSION_LABEL[t] ?? t))}</Fact>
        <Fact label="Languages">{list(review.languages)}</Fact>
        <Fact label="Car">{car || "Not provided"}</Fact>
        <Fact label="City">{review.service_city?.trim() || "Not provided"}</Fact>
        <Fact label="Specialisms" wide>{list(review.specialisms)}</Fact>
        <Fact label="Test centres" wide>{list(centres)}</Fact>
        <Fact label="Travel area" wide>{area}</Fact>
      </dl>
    </div>
  );
}

export function ReviewStep({
  review,
  busy,
  error,
  onConfirm,
}: {
  review: ListingReview;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-5">
      <ListingSummary review={review} />
      <p className="mt-3 text-[13px] leading-5 text-ink-secondary">
        Something wrong? Email{" "}
        <a
          className="font-semibold text-ink underline"
          href="mailto:support@newdryve.com?subject=Instructor%20listing%20correction"
        >
          support@newdryve.com
        </a>{" "}
        before you go live.
      </p>

      {/* On a phone the listing is taller than the screen, so the button is
          pinned to the bottom where a thumb already is, rather than waiting
          at the end of a scroll. From `sm` up it sits inline after the
          details. The error travels with it so a failed tap is never
          reported somewhere off screen. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_-20px_rgba(10,10,20,0.35)] sm:static sm:z-auto sm:mt-5 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        {error ? (
          <p role="alert" className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="focus-ring inline-flex h-12 w-full items-center justify-center rounded-full bg-racing-green px-6 text-[15px] font-bold text-white disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:text-sm"
        >
          {busy ? "Confirming…" : "Confirm and go live"}
        </button>
      </div>
    </div>
  );
}
