"use client";

import PromotionsPanel from "@/components/organisations/PromotionsPanel";
import type { Promotion } from "@/lib/organisations/promotions";

export interface SchoolPromotions {
  id: string;
  name: string;
  /** Null when the offers could not be read; the panel then says so instead of guessing. */
  promotions: Promotion[] | null;
  error?: string | null;
}

/**
 * The school's intro offer (Promotions): a cheaper hourly rate for a learner's
 * first hours booked through the school. One per school, edited in place;
 * written with POST/PATCH /v1/organisations/me/promotions through the portal's
 * own routes.
 */
export default function PromotionsForm({ schools }: { schools: SchoolPromotions[] }) {
  return (
    <section aria-labelledby="promotions-title" className="mt-8">
      <h2 id="promotions-title" className="font-display text-2xl text-ink">
        Intro offer
      </h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-secondary">
        A cheaper hourly rate for a learner&rsquo;s first lessons with your school, for example their first 6 hours at
        £36 an hour. It applies to lessons booked through your school&rsquo;s listing from the moment you save it. The
        difference comes off the instructor&rsquo;s price for those hours, and a percentage fee follows the lower price.
        Lessons already booked keep their price.
      </p>
      <div className="mt-4 space-y-6">
        {schools.map((school) => (
          <div key={school.id}>
            {schools.length > 1 ? <h3 className="mb-2 font-display text-xl text-ink">{school.name}</h3> : null}
            <PromotionsPanel
              audience="school"
              organisationId={school.id}
              name={school.name}
              promotions={school.promotions}
              error={school.error}
              endpoints={{
                create: "/organisations/api/promotions",
                update: (promotionId) => `/organisations/api/promotions/${promotionId}`,
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
