import { INSTRUCTORS } from '@/lib/instructors';

const COLORS = {
  green: '#2D6A4F',
  greenSoft: 'rgba(45,106,79,0.10)',
  rose: '#E8527A',
  canvas: '#F0EDF0',
  white: '#FFFFFF',
  ink: '#0A0A14',
  inkSecondary: '#6B6B84',
  border: '#E8E8F2',
};

export function StaticBookingFlow() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: COLORS.canvas,
        fontFamily: 'var(--font-sans, "DM Sans", system-ui, sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ height: 44, padding: '0 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: COLORS.ink }}>
        <span>9:41</span>
        <span style={{ fontSize: 11, fontWeight: 800 }}>100%</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', gap: 18 }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: COLORS.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(45,106,79,0.35)',
          }}
          aria-hidden="true"
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M12 24l8 8 16-18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink, letterSpacing: -0.5, marginBottom: 6 }}>You&rsquo;re booked!</div>
          <div style={{ fontSize: 13, color: COLORS.inkSecondary }}>
            Wed&nbsp;14&nbsp;Aug · 9:00 am
          </div>
        </div>

        <div
          style={{
            width: '100%',
            background: COLORS.white,
            borderRadius: 14,
            border: `1px solid ${COLORS.border}`,
            padding: 14,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: INSTRUCTORS[0].color,
              color: 'white',
              fontWeight: 800,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            {INSTRUCTORS[0].initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.ink }}>{INSTRUCTORS[0].name}</div>
            <div style={{ fontSize: 11, color: COLORS.inkSecondary }}>2-hour lesson</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.green, fontVariantNumeric: 'tabular-nums' }}>£76</div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(232,82,122,0.10)',
            color: COLORS.rose,
            borderRadius: 999,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span aria-hidden="true">⏱</span>
          Booked in 47 seconds
        </div>
      </div>
    </div>
  );
}
