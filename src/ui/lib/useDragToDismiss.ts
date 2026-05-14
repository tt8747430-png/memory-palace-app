'use client';

import { useRef, type PointerEvent } from 'react';

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
      requestAnimationFrame(() => reset());
    } else {
      reset();
    }
  };

  return { ref, onPointerDown, onPointerMove, onPointerUp };
}
