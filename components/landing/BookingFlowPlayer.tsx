'use client';

import { useEffect, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { BookingFlowComposition } from './BookingFlowComposition';
import { StaticBookingFlow } from './StaticBookingFlow';
import { PhoneFrame } from './PhoneFrame';

export function BookingFlowPlayer() {
  const reduced = useReducedMotion();
  const playerRef = useRef<PlayerRef>(null);

  // `autoPlay` can race with hydration in React 19 / Next 16 and leave the
  // player paused on frame 0. Drive playback imperatively so it always starts.
  useEffect(() => {
    if (reduced) return;
    const player = playerRef.current;
    if (!player) return;

    let cancelled = false;
    const tryPlay = () => {
      if (cancelled || !playerRef.current) return;
      try {
        playerRef.current.play();
      } catch {
        // Player not mounted yet; retry on the next frame.
        requestAnimationFrame(tryPlay);
      }
    };
    tryPlay();

    // Pause when the tab is hidden, resume on return. Prevents the loop from
    // drifting out of sync and saves cycles.
    const onVisibility = () => {
      const p = playerRef.current;
      if (!p) return;
      if (document.hidden) p.pause();
      else p.play();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

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
            ref={playerRef}
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
