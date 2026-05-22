'use client';

import { useEffect, useState } from 'react';
import { INSTRUCTORS, SLOTS } from '@/lib/instructors';

const SCENE_MS = 3000;

const C = {
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
  amberSoft: 'rgba(255,176,32,0.15)',
  amberInk: '#B07000',
};

const FONT = 'var(--font-sans, "DM Sans", system-ui, sans-serif)';

function StatusBar() {
  return (
    <div style={{ height: 44, padding: '0 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: C.ink, flexShrink: 0 }}>
      <span>9:41</span>
      <span style={{ fontSize: 11, fontWeight: 800 }}>100%</span>
    </div>
  );
}

function DiscoverScene() {
  return (
    <div style={sceneRoot}>
      <StatusBar />
      <div style={{ padding: '0 18px 12px' }}>
        <div className="bf-anim-fade" style={{ fontSize: 11, fontWeight: 700, color: C.rose, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          Norwich
        </div>
        <div className="bf-anim-fade" style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: -0.5, animationDelay: '60ms' }}>
          Find your instructor
        </div>
      </div>

      <div style={{ padding: '0 18px' }}>
        <div
          className="bf-anim-fade"
          style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: C.inkMuted,
            animationDelay: '160ms',
          }}
        >
          <span style={{ fontSize: 14 }} aria-hidden="true">🔍</span>
          <span>Search by area or name…</span>
        </div>
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1, 2].map((idx) => {
          const ins = INSTRUCTORS[idx];
          const highlighted = idx === 0;
          return (
            <div
              key={ins.id}
              className="bf-anim-rise"
              style={{
                animationDelay: `${260 + idx * 110}ms`,
                background: C.white,
                borderRadius: 14,
                padding: 12,
                border: `1px solid ${highlighted ? C.green : C.border}`,
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
                  background: ins.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {ins.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 2 }}>{ins.name}</div>
                <div style={{ fontSize: 11, color: C.inkSecondary, fontVariantNumeric: 'tabular-nums' }}>
                  ★ {ins.rating.toFixed(1)} · {ins.reviews} reviews
                </div>
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: C.green }}>£{ins.pricePerHour}/hr</div>
              </div>
              <div
                style={{
                  alignSelf: 'flex-start',
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  background: highlighted ? C.green : C.greenSoft,
                  color: highlighted ? 'white' : C.green,
                  borderRadius: 999,
                  padding: '4px 8px',
                }}
              >
                {ins.slotsToday > 0 ? `${ins.slotsToday} TODAY` : 'TOMORROW'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlotsScene() {
  const ins = INSTRUCTORS[0];
  const selectedSlotIdx = 1;

  return (
    <div style={sceneRoot}>
      <StatusBar />

      <div style={{ padding: '0 18px 14px' }} className="bf-anim-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: ins.color,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 12,
            }}
            aria-hidden="true"
          >
            {ins.initials}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{ins.name}</div>
            <div style={{ fontSize: 11, color: C.inkSecondary, fontVariantNumeric: 'tabular-nums' }}>
              ★ {ins.rating.toFixed(1)} · £{ins.pricePerHour}/hr
            </div>
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, letterSpacing: -0.3 }}>Pick a time</div>
      </div>

      <div className="bf-anim-fade" style={{ padding: '0 18px 12px', display: 'flex', gap: 6, animationDelay: '80ms' }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => {
          const active = i === 2;
          return (
            <div
              key={d}
              style={{
                background: active ? C.ink : C.white,
                color: active ? 'white' : C.inkSecondary,
                border: `1px solid ${active ? C.ink : C.border}`,
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

      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
        {SLOTS.map((s, i) => {
          const isSelectedTarget = i === selectedSlotIdx;
          const taken = !s.avail;
          const tagBg = taken ? C.canvas : s.tag === 'Early' ? C.amberSoft : s.tag ? C.roseSoft : 'transparent';
          const tagColor = taken ? C.inkMuted : s.tag === 'Early' ? C.amberInk : C.rose;
          return (
            <div
              key={s.time}
              className={`bf-anim-rise ${isSelectedTarget ? 'bf-slot-select' : ''}`}
              style={{
                animationDelay: `${140 + i * 50}ms`,
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: taken ? C.inkMuted : C.ink,
                opacity: taken ? 0.5 : 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }} className="bf-slot-time">{s.time}</span>
              <span
                className="bf-slot-tag"
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  background: tagBg,
                  color: tagColor,
                  padding: s.tag ? '3px 8px' : 0,
                  borderRadius: 999,
                }}
                data-default-label={s.tag ?? ''}
              >
                {s.tag ?? ''}
              </span>
            </div>
          );
        })}

        {/* Animated cursor that "taps" the second slot */}
        <div className="bf-cursor" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="14" fill="white" stroke={C.ink} strokeWidth="2.5" />
            <circle className="bf-cursor-ring" cx="18" cy="18" r="6" fill={C.ink} opacity="0.7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ConfirmScene() {
  const ins = INSTRUCTORS[0];
  return (
    <div style={sceneRoot}>
      <StatusBar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', gap: 18 }}>
        <div
          className="bf-check-circle"
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: C.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(45,106,79,0.35)',
          }}
          aria-hidden="true"
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path
              className="bf-check-path"
              d="M12 24l8 8 16-18"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="bf-anim-fade" style={{ textAlign: 'center', animationDelay: '300ms' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: -0.5, marginBottom: 6 }}>You&rsquo;re booked!</div>
          <div style={{ fontSize: 13, color: C.inkSecondary }}>Wed&nbsp;14&nbsp;Aug · 9:00 am</div>
        </div>

        <div
          className="bf-anim-rise"
          style={{
            animationDelay: '420ms',
            width: '100%',
            background: C.white,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
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
              background: ins.color,
              color: 'white',
              fontWeight: 800,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            {ins.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{ins.name}</div>
            <div style={{ fontSize: 11, color: C.inkSecondary }}>2-hour lesson · {ins.car.split(',')[0].trim()}</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.green, fontVariantNumeric: 'tabular-nums' }}>£76</div>
        </div>

        <div
          className="bf-anim-fade"
          style={{
            animationDelay: '620ms',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: C.roseSoft,
            color: C.rose,
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
    </div>
  );
}

const sceneRoot: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: C.canvas,
  fontFamily: FONT,
  display: 'flex',
  flexDirection: 'column',
};

const STYLES = `
.bf-root {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: ${C.canvas};
}
.bf-scene-wrapper {
  position: absolute;
  inset: 0;
  animation: bf-scene-in 380ms ease-out both;
}
@keyframes bf-scene-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.bf-anim-fade {
  animation: bf-fade 480ms ease-out both;
}
@keyframes bf-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.bf-anim-rise {
  animation: bf-rise 540ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes bf-rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Animated cursor: travel down/left, tap the 9:00 am slot, fade out */
.bf-cursor {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  opacity: 0;
  transform: translate(228px, 100px);
  animation: bf-cursor-path 2400ms ease-in-out 600ms both;
}
@keyframes bf-cursor-path {
  0%   { opacity: 0; transform: translate(228px, 100px); }
  10%  { opacity: 1; transform: translate(228px, 100px); }
  55%  { opacity: 1; transform: translate(150px, 165px); }
  70%  { opacity: 1; transform: translate(150px, 165px) scale(0.85); }
  85%  { opacity: 1; transform: translate(150px, 165px) scale(1); }
  100% { opacity: 0; transform: translate(150px, 165px); }
}
.bf-cursor-ring {
  transform-origin: 18px 18px;
  animation: bf-cursor-ring 2400ms ease-in-out 600ms both;
}
@keyframes bf-cursor-ring {
  0%, 60% { transform: scale(1); opacity: 0.7; }
  72%     { transform: scale(2); opacity: 0; }
  100%    { transform: scale(1); opacity: 0; }
}

/* Slot selection flips visual on tap (second row only) */
.bf-slot-select {
  animation: bf-slot-rise-and-select 2400ms cubic-bezier(0.22, 1, 0.36, 1) 190ms both;
}
@keyframes bf-slot-rise-and-select {
  0%   { opacity: 0; transform: translateY(18px); background: ${C.white}; border-color: ${C.border}; color: ${C.ink}; }
  22%  { opacity: 1; transform: translateY(0);    background: ${C.white}; border-color: ${C.border}; color: ${C.ink}; }
  60%  { opacity: 1; transform: translateY(0);    background: ${C.white}; border-color: ${C.border}; color: ${C.ink}; }
  68%  { opacity: 1; transform: translateY(0) scale(1.02); background: ${C.green}; border-color: ${C.green}; color: ${C.white}; }
  100% { opacity: 1; transform: translateY(0) scale(1); background: ${C.green}; border-color: ${C.green}; color: ${C.white}; }
}
.bf-slot-select .bf-slot-tag {
  animation: bf-slot-tag-flip 2400ms cubic-bezier(0.22, 1, 0.36, 1) 190ms both;
}
@keyframes bf-slot-tag-flip {
  0%, 67% { background: transparent; color: transparent; }
  68%, 100% { background: rgba(255,255,255,0.2); color: ${C.white}; }
}

/* Check icon scale + stroke draw on confirm scene */
.bf-check-circle {
  animation: bf-check-pop 540ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
}
@keyframes bf-check-pop {
  0% { transform: scale(0.3); opacity: 0; }
  60% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.bf-check-path {
  stroke-dasharray: 50;
  stroke-dashoffset: 50;
  animation: bf-check-draw 480ms ease-out 300ms both;
}
@keyframes bf-check-draw {
  to { stroke-dashoffset: 0; }
}
`;

export function BookingFlowAnimated() {
  const [scene, setScene] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setScene((s) => ((s + 1) % 3) as 0 | 1 | 2);
    }, SCENE_MS);
    const onVis = () => {
      // Reset to first scene when tab becomes visible again so loop is in sync.
      if (!document.hidden) setScene(0);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div className="bf-root">
        <div key={scene} className="bf-scene-wrapper">
          {scene === 0 && <DiscoverScene />}
          {scene === 1 && <SlotsScene />}
          {scene === 2 && <ConfirmScene />}
        </div>
      </div>
    </>
  );
}
