import type { Instructor } from '@/lib/instructors';

export function InstructorCard({
  instructor,
  compact = false,
}: {
  instructor: Instructor;
  compact?: boolean;
}) {
  const { name, initials, rating, reviews, pricePerHour, transmission, specialisms, color, slotsToday, areas, yearsExp, dbsVerified } = instructor;

  return (
    <article
      className="group relative rounded-2xl bg-white border border-[#E8E8F2] p-5 motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_20px_40px_-12px_rgba(45,106,79,0.18)] focus-within:-translate-y-1"
      style={{ touchAction: 'manipulation' }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 flex items-center justify-center text-white font-bold rounded-full"
          style={{
            width: compact ? 44 : 56,
            height: compact ? 44 : 56,
            background: color,
            fontSize: compact ? 14 : 18,
            letterSpacing: '0.5px',
          }}
          aria-hidden="true"
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-ink text-base leading-tight m-0">
              {name}
            </h3>
            {dbsVerified && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                style={{ background: 'rgba(0,194,122,0.12)', color: '#00875A' }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 5l2 2 4-4" stroke="#00875A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                DBS
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2 tabular-nums text-sm text-ink-secondary">
            <span className="text-ink font-bold">★&nbsp;{rating.toFixed(1)}</span>
            <span className="text-ink-muted">·</span>
            <span>{reviews}&nbsp;reviews</span>
            <span className="text-ink-muted">·</span>
            <span>{yearsExp}&nbsp;yrs</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {transmission.map((t) => (
              <span
                key={t}
                className="text-[11px] font-semibold rounded-full px-2 py-0.5"
                style={{ background: '#F8F2F4', color: '#0A0A14' }}
              >
                {t}
              </span>
            ))}
            {specialisms.slice(0, 1).map((s) => (
              <span
                key={s}
                className="text-[11px] font-semibold rounded-full px-2 py-0.5"
                style={{ background: 'rgba(232,82,122,0.10)', color: '#E8527A' }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#E8E8F2] flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted">From</span>
          <span className="text-lg font-bold text-ink tabular-nums">£{pricePerHour}<span className="text-sm text-ink-secondary font-medium">&nbsp;/hr</span></span>
        </div>

        {slotsToday > 0 ? (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1.5"
            style={{ background: 'rgba(45,106,79,0.10)', color: '#2D6A4F' }}
          >
            <span className="size-1.5 rounded-full" style={{ background: '#2D6A4F' }} aria-hidden="true" />
            {slotsToday}&nbsp;slots today
          </span>
        ) : (
          <span className="text-xs font-semibold text-ink-muted">No slots today</span>
        )}
      </div>

      {!compact && (
        <div className="mt-3 text-xs text-ink-muted truncate">
          {areas.slice(0, 2).join(' · ')}
        </div>
      )}
    </article>
  );
}
