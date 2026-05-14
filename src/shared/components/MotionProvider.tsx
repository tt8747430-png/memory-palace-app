'use client';

import { LazyMotion, MotionConfig, domMax } from 'framer-motion';

/**
 * App-wide framer-motion setup.
 *
 * We load `domMax` (not `domAnimation`) because the app uses drag/pan gestures
 * in SlideToConfirm, SwipeableFlashcard, and RoomJourney. `domAnimation` does
 * not bundle the drag/pan/layout features, which would cause those gestures
 * to silently no-op when wrapped in <m.*> with `strict` mode.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
