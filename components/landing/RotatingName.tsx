'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';

const NAMES = [
  'Sarah',
  'James',
  'Priya',
  'Tom',
  'Emma',
  'Aisha',
  'Jordan',
  'Maya',
  'Liam',
  'Noor',
];

function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function RotatingName() {
  const reduced = useReducedMotion();
  // Index into NAMES. Starts at 0 so SSR + first client render both show
  // NAMES[0] — no hydration mismatch. The rotation kicks in post-mount.
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;
    // Generate the random order on the client only, after mount.
    const order = shuffle(NAMES);
    let cursor = 0;
    const id = window.setInterval(() => {
      cursor = (cursor + 1) % order.length;
      setIndex(NAMES.indexOf(order[cursor]));
    }, 1800);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <span className="rotating-name" aria-live="polite" aria-atomic="true">
      <span key={index} className="gradient-text rotating-name-inner">
        {NAMES[index]}
      </span>
    </span>
  );
}
