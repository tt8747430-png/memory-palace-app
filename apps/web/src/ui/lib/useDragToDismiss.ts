'use client';

import { useRef, type PointerEvent } from 'react';

/**
 * Touch-driven drag-to-dismiss for mobile bottom-sheet UIs (Dialog, Sheet).
 * Returns pointer handlers to attach to the visible drag handle and a `ref`
 * that should be attached to the element being translated.
 *
 * Behavior:
 * - Activates only on `pointerType === 'touch'` so mouse/trackpad clicks on the
 *   handle don't accidentally drag the sheet.
 * - Translates the target element by the downward delta in real time.
 * - On release, dismisses if drag distance > 100 px OR flick velocity > 0.6 px/ms;
 *   otherwise springs back to origin via a 200 ms ease-out CSS transition.
 *
 * Implementation note: we intentionally avoid framer-motion here so the shared
 * UI package stays dependency-light. The translation is set imperatively on
 * the DOM (`style.transform`) which is fast and bypasses React re-renders.
 */
export function useDragToDismiss(onDismiss: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  const start = useRef<{ y: number; t: number } | null>(null);

  const reset = () => {
    if (!ref.current) return;
    ref.current.style.transform = '';
    ref.current.style.transition = 'transform 200ms ease-out';
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'touch') return;
    start.current = { y: event.clientY, t: performance.now() };
    if (ref.current) ref.current.style.transition = 'none';
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!start.current || !ref.current) return;
    const dy = Math.max(0, event.clientY - start.current.y);
    ref.current.style.transform = `translateY(${dy}px)`;
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (!start.current) return;
    const dy = Math.max(0, event.clientY - start.current.y);
    const dt = Math.max(1, performance.now() - start.current.t);
    const velocity = dy / dt; // px / ms
    start.current = null;
    if (dy > 100 || velocity > 0.6) {
      onDismiss();
      // Reset transform shortly so the next open isn't translated.
      requestAnimationFrame(() => reset());
    } else {
      reset();
    }
  };

  return { ref, onPointerDown, onPointerMove, onPointerUp };
}
