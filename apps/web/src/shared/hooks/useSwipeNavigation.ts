'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { PanInfo } from 'framer-motion';

/**
 * framer-motion drag thresholds: a swipe is recognised when EITHER the
 * horizontal offset exceeds {@link OFFSET_PX} px OR the velocity exceeds
 * {@link VELOCITY_PX_PER_S} px/s. Mirrors common Anki/Tinder card behaviour.
 */
const OFFSET_PX = 80;
const VELOCITY_PX_PER_S = 500;

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeNavigationOptions {
  onPrev?: () => void;
  onNext?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  /** Disable swipe entirely (useful while a result is showing). */
  disabled?: boolean;
}

export interface SwipeBindings {
  /** Spread onto a `<m.div drag …>` to enable horizontal swipe. */
  drag: 'x' | 'y' | boolean;
  dragConstraints: { left: 0; right: 0; top: 0; bottom: 0 };
  dragElastic: number;
  onDragEnd: (event: PointerEvent, info: PanInfo) => void;
}

/**
 * framer-motion-driven swipe handler. The element snaps back to origin via
 * the spring; we trigger nav callbacks based on offset OR velocity, then
 * the caller is expected to unmount the card so the spring is irrelevant.
 *
 * Decision: swipe is purely additive to keyboard/button controls. The hook
 * does not call `preventDefault` and does not block scrolling, so vertical
 * page scroll continues to work on long content.
 */
export function useSwipeNavigation({
  onPrev,
  onNext,
  onSwipeUp,
  onSwipeDown,
  disabled = false,
}: SwipeNavigationOptions): SwipeBindings {
  // Pin handlers in a ref so the bindings object is stable across renders —
  // avoids restarting framer-motion's drag listeners every render. Updating
  // the ref in an effect (not during render) keeps React 19 strict-mode and
  // the `react-hooks/refs` rule happy.
  const handlersRef = useRef({ onPrev, onNext, onSwipeUp, onSwipeDown });
  useEffect(() => {
    handlersRef.current = { onPrev, onNext, onSwipeUp, onSwipeDown };
  }, [onPrev, onNext, onSwipeUp, onSwipeDown]);

  const onDragEnd = useCallback(
    (_event: PointerEvent, info: PanInfo) => {
      if (disabled) return;
      const { offset, velocity } = info;
      const absX = Math.abs(offset.x);
      const absY = Math.abs(offset.y);
      // Determine dominant axis — prevents ambiguous diagonal swipes.
      if (absX > absY) {
        if (offset.x > OFFSET_PX || velocity.x > VELOCITY_PX_PER_S) {
          handlersRef.current.onPrev?.();
        } else if (offset.x < -OFFSET_PX || velocity.x < -VELOCITY_PX_PER_S) {
          handlersRef.current.onNext?.();
        }
      } else {
        if (offset.y < -OFFSET_PX || velocity.y < -VELOCITY_PX_PER_S) {
          handlersRef.current.onSwipeUp?.();
        } else if (offset.y > OFFSET_PX || velocity.y > VELOCITY_PX_PER_S) {
          handlersRef.current.onSwipeDown?.();
        }
      }
    },
    [disabled],
  );

  // Allow free X/Y drag when both axes have handlers; default to X only.
  const hasVertical = Boolean(onSwipeUp || onSwipeDown);
  return {
    drag: disabled ? false : hasVertical ? true : 'x',
    dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 },
    dragElastic: 0.4,
    onDragEnd,
  };
}
