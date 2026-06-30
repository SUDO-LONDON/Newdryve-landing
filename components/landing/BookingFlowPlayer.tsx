'use client';

import { useReducedMotion } from '@/lib/useReducedMotion';
import { BookingFlowAnimated } from './BookingFlowAnimated';
import { StaticBookingFlow } from './StaticBookingFlow';
import { PhoneFrame } from './PhoneFrame';

export function BookingFlowPlayer() {
  const reduced = useReducedMotion();

  return (
    <div
      role="img"
      aria-label="Animated demo of booking a 2-hour driving lesson with Sarah Mitchell in under a minute"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 360,
        aspectRatio: '360 / 720',
        containerType: 'inline-size',
        // The inner layer is a fixed 360px box scaled down with a transform;
        // transforms don't shrink the layout box, so clip it here to stop the
        // 360px width leaking out as horizontal overflow on narrow screens.
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 360,
          height: 720,
          transformOrigin: 'top left',
          transform: 'scale(min(1, calc(100cqi / 360px)))',
        }}
      >
        <PhoneFrame>
          {reduced ? <StaticBookingFlow /> : <BookingFlowAnimated />}
        </PhoneFrame>
      </div>
    </div>
  );
}
