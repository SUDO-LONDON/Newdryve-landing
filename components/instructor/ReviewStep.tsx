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
      <dt className="nd-help font-semibold">{label}</dt>
      <dd className="mt-0.5 text-[17px] leading-6">{children}</dd>
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
    <div className="nd-card p-4 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="nd-h4">{review.display_name?.trim() || "Name not provided"}</p>
        <p className="nd-h4 shrink-0">
          {review.price_per_hour_pence == null ? "Price not set" : `${hourly(review.price_per_hour_pence)}/hr`}
        </p>
      </div>
      <p className="nd-body mt-3">{review.bio?.trim() || "No bio provided."}</p>

      <dl className="nd-divider mt-5 grid grid-cols-2 gap-x-4 gap-y-4 pt-5">
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
      <p className="nd-help mt-3">
        Something wrong? Email{" "}
        <a
          className="nd-link"
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
      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 bg-[var(--paper)] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:z-auto sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0">
        {error ? (
          <p role="alert" className="nd-alert mb-3">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="nd-btn nd-btn-lg w-full sm:w-auto"
        >
          {busy ? "Confirming…" : "Confirm and go live"}
        </button>
      </div>
    </div>
  );
}
