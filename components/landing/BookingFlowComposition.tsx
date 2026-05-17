'use client';

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { INSTRUCTORS, SLOTS } from '@/lib/instructors';

const COLORS = {
  green: '#2D6A4F',
  greenSoft: 'rgba(45,106,79,0.10)',
  rose: '#E8527A',
  roseSoft: 'rgba(232,82,122,0.10)',
  canvas: '#F0EDF0',
  white: '#FFFFFF',
  ink: '#0A0A14',
  inkSecondary: '#6B6B84',
  inkMuted: '#9B9BB5',
  border: '#E8E8F2',
  blush: '#F8F2F4',
};

const SCENE_DUR = 90;

function StatusBar() {
  return (
    <div
      style={{
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        fontSize: 13,
        fontWeight: 700,
        color: COLORS.ink,
      }}
    >
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 11 }}>●●●●</span>
        <span style={{ fontSize: 11 }}>📶</span>
        <span style={{ fontSize: 11, fontWeight: 800 }}>100%</span>
      </div>
    </div>
  );
}

function MiniInstructorRow({
  initials,
  color,
  name,
  rating,
  reviews,
  price,
  tag,
  highlighted,
}: {
  initials: string;
  color: string;
  name: string;
  rating: number;
  reviews: number;
  price: number;
  tag: string;
  highlighted?: boolean;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        borderRadius: 14,
        padding: 12,
        border: `1px solid ${highlighted ? COLORS.green : COLORS.border}`,
        display: 'flex',
        gap: 12,
        boxShadow: highlighted ? '0 8px 24px rgba(45,106,79,0.15)' : 'none',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink, marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 11, color: COLORS.inkSecondary, fontVariantNumeric: 'tabular-nums' }}>
          ★ {rating.toFixed(1)} · {reviews} reviews
        </div>
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: COLORS.green }}>£{price}/hr</div>
      </div>
      <div
        style={{
          alignSelf: 'flex-start',
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          background: highlighted ? COLORS.green : COLORS.greenSoft,
          color: highlighted ? 'white' : COLORS.green,
          borderRadius: 999,
          padding: '4px 8px',
        }}
      >
        {tag}
      </div>
    </div>
  );
}

function DiscoverScene({ progress }: { progress: number }) {
  const cardProgress = (idx: number) => {
    const start = idx * 10;
    return interpolate(progress, [start, start + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  };

  const searchOpacity = interpolate(progress, [5, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <StatusBar />
      <div style={{ padding: '0 18px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.rose, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          Norwich
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink, letterSpacing: -0.5 }}>
          Find your instructor
        </div>
      </div>

      <div style={{ padding: '0 18px', opacity: searchOpacity }}>
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: COLORS.inkMuted,
          }}
        >
          <span style={{ fontSize: 14 }}>🔍</span>
          <span>Search by area or name…</span>
        </div>
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1, 2].map((idx) => {
          const ins = INSTRUCTORS[idx];
          const p = cardProgress(idx);
          return (
            <div
              key={ins.id}
              style={{
                opacity: p,
                transform: `translateY(${(1 - p) * 30}px)`,
              }}
            >
              <MiniInstructorRow
                initials={ins.initials}
                color={ins.color}
                name={ins.name}
                rating={ins.rating}
                reviews={ins.reviews}
                price={ins.pricePerHour}
                tag={ins.slotsToday > 0 ? `${ins.slotsToday} TODAY` : 'TOMORROW'}
                highlighted={idx === 0}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function SlotsScene({ progress, fps }: { progress: number; fps: number }) {
  const headerOpacity = interpolate(progress, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const selectedSlotIdx = 1;
  const selectAt = 50;
  const isSelected = (i: number) => i === selectedSlotIdx && progress > selectAt;

  const pointerX = interpolate(progress, [20, 55], [240, 165], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pointerY = interpolate(progress, [20, 55], [220, 312], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pointerOpacity = interpolate(progress, [15, 25, 55, 65], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const tapPulse = spring({ frame: Math.max(0, progress - selectAt), fps, from: 0, to: 1, config: { damping: 8, stiffness: 120 } });

  return (
    <AbsoluteFill>
      <StatusBar />

      <div style={{ padding: '0 18px 14px', opacity: headerOpacity }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: INSTRUCTORS[0].color,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            {INSTRUCTORS[0].initials}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{INSTRUCTORS[0].name}</div>
            <div style={{ fontSize: 11, color: COLORS.inkSecondary, fontVariantNumeric: 'tabular-nums' }}>
              ★ {INSTRUCTORS[0].rating.toFixed(1)} · £{INSTRUCTORS[0].pricePerHour}/hr
            </div>
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink, letterSpacing: -0.3 }}>
          Pick a time
        </div>
      </div>

      {/* day chips */}
      <div style={{ padding: '0 18px 12px', display: 'flex', gap: 6, opacity: headerOpacity }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => {
          const active = i === 2;
          return (
            <div
              key={d}
              style={{
                background: active ? COLORS.ink : COLORS.white,
                color: active ? 'white' : COLORS.inkSecondary,
                border: `1px solid ${active ? COLORS.ink : COLORS.border}`,
                borderRadius: 10,
                padding: '8px 10px',
                fontSize: 11,
                fontWeight: 700,
                minWidth: 40,
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <div style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase' }}>{d}</div>
              <div style={{ marginTop: 2, fontSize: 13 }}>{12 + i}</div>
            </div>
          );
        })}
      </div>

      {/* slot list */}
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
        {SLOTS.map((s, i) => {
          const sel = isSelected(i);
          const taken = !s.avail;
          const rowOpacity = interpolate(progress, [10 + i * 4, 25 + i * 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const bgFrom = COLORS.white;
          const bgTo = COLORS.green;
          const bg = sel
            ? interpolateColor(
                interpolate(progress, [selectAt, selectAt + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                bgFrom,
                bgTo,
              )
            : COLORS.white;
          const fg = sel ? 'white' : taken ? COLORS.inkMuted : COLORS.ink;
          const border = sel ? COLORS.green : COLORS.border;
          return (
            <div
              key={s.time}
              style={{
                opacity: rowOpacity * (taken ? 0.5 : 1),
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: fg,
                fontVariantNumeric: 'tabular-nums',
                transform: sel ? `scale(${1 + tapPulse * 0.02})` : 'scale(1)',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>{s.time}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  background: sel ? 'rgba(255,255,255,0.2)' : taken ? COLORS.canvas : s.tag === 'Early' ? 'rgba(255,176,32,0.15)' : s.tag ? COLORS.roseSoft : 'transparent',
                  color: sel ? 'white' : taken ? COLORS.inkMuted : s.tag === 'Early' ? '#B07000' : COLORS.rose,
                  padding: s.tag || sel ? '3px 8px' : 0,
                  borderRadius: 999,
                }}
              >
                {sel ? 'Selected' : s.tag ?? ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* animated pointer/cursor */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: pointerX,
          top: pointerY,
          opacity: pointerOpacity,
          pointerEvents: 'none',
          transition: 'none',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="14" fill="white" stroke={COLORS.ink} strokeWidth="2.5" />
          <circle cx="18" cy="18" r={6 + tapPulse * 6} fill={COLORS.ink} opacity={0.7 - tapPulse * 0.5} />
        </svg>
      </div>
    </AbsoluteFill>
  );
}

function ConfirmScene({ progress, fps }: { progress: number; fps: number }) {
  const checkScale = spring({ frame: Math.max(0, progress - 5), fps, from: 0, to: 1, config: { damping: 9, stiffness: 110 } });
  const textOpacity = interpolate(progress, [20, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const stopwatchOpacity = interpolate(progress, [45, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cardOpacity = interpolate(progress, [30, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <StatusBar />
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
            transform: `scale(${checkScale})`,
            boxShadow: `0 12px 32px rgba(45,106,79,0.35)`,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path
              d="M12 24l8 8 16-18"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="50"
              strokeDashoffset={interpolate(progress, [10, 30], [50, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
            />
          </svg>
        </div>

        <div style={{ textAlign: 'center', opacity: textOpacity }}>
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
            opacity: cardOpacity,
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
          >
            {INSTRUCTORS[0].initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.ink }}>{INSTRUCTORS[0].name}</div>
            <div style={{ fontSize: 11, color: COLORS.inkSecondary }}>2-hour lesson · {INSTRUCTORS[0].car.split('—')[0].trim()}</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.green, fontVariantNumeric: 'tabular-nums' }}>£76</div>
        </div>

        <div
          style={{
            opacity: stopwatchOpacity,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(232,82,122,0.10)',
            color: COLORS.rose,
            borderRadius: 999,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.3,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span aria-hidden="true">⏱</span>
          Booked in 47 seconds
        </div>
      </div>
    </AbsoluteFill>
  );
}

function interpolateColor(t: number, from: string, to: string): string {
  const parse = (h: string) => {
    const n = h.replace('#', '');
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export const BookingFlowComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scene = Math.min(2, Math.floor(frame / SCENE_DUR));
  const local = frame - scene * SCENE_DUR;
  const sceneProgress = local;

  const fadeIn = interpolate(local, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(local, [SCENE_DUR - 10, SCENE_DUR], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sceneOpacity = scene === 2 ? fadeIn : fadeIn * fadeOut;

  return (
    <AbsoluteFill style={{ background: COLORS.canvas, fontFamily: 'var(--font-sans, "DM Sans", system-ui, sans-serif)' }}>
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        {scene === 0 && <DiscoverScene progress={sceneProgress} />}
        {scene === 1 && <SlotsScene progress={sceneProgress} fps={fps} />}
        {scene === 2 && <ConfirmScene progress={sceneProgress} fps={fps} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
