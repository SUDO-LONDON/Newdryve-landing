'use client';

import { Player } from '@remotion/player';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { BookingFlowComposition } from './BookingFlowComposition';
import { StaticBookingFlow } from './StaticBookingFlow';
import { PhoneFrame } from './PhoneFrame';

export function BookingFlowPlayer() {
  const reduced = useReducedMotion();

  return (
    <div
      role="img"
      aria-label="Animated demo of booking a 2-hour driving lesson with Sarah Mitchell in under a minute"
      className="relative"
    >
      <PhoneFrame>
        {reduced ? (
          <StaticBookingFlow />
        ) : (
          <Player
            component={BookingFlowComposition}
            durationInFrames={270}
            fps={30}
            compositionWidth={332}
            compositionHeight={692}
            autoPlay
            loop
            controls={false}
            clickToPlay={false}
            doubleClickToFullscreen={false}
            acknowledgeRemotionLicense
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </PhoneFrame>
    </div>
  );
}
