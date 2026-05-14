'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { PanInfo } from 'framer-motion';

const OFFSET_PX = 80;
const VELOCITY_PX_PER_S = 500;

export interface SwipeNavigationOptions {
  onPrev?: () => void;
  onNext?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;

  disabled?: boolean;
}

export interface SwipeBindings {
  drag: 'x' | 'y' | boolean;
  dragConstraints: { left: 0; right: 0; top: 0; bottom: 0 };
  dragElastic: number;
  onDragEnd: (event: PointerEvent, info: PanInfo) => void;
}

export function useSwipeNavigation({
  onPrev,
  onNext,
  onSwipeUp,
  onSwipeDown,
  disabled = false,
}: SwipeNavigationOptions): SwipeBindings {
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

  const hasVertical = Boolean(onSwipeUp || onSwipeDown);
  return {
    drag: disabled ? false : hasVertical ? true : 'x',
    dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 },
    dragElastic: 0.4,
    onDragEnd,
  };
}
