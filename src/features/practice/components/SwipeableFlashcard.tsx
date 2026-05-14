'use client';

import { useState, type ReactNode } from 'react';
import { m, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { cn } from '@/ui';

export interface SwipeableFlashcardProps {
  cardKey: string | number;
  front: ReactNode;
  back: ReactNode;
  flipped: boolean;
  onToggleFlip: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  className?: string;
  swipeThreshold?: number;
}

const DEFAULT_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 600;

export function SwipeableFlashcard({
  cardKey,
  front,
  back,
  flipped,
  onToggleFlip,
  onSwipeLeft,
  onSwipeRight,
  className,
  swipeThreshold = DEFAULT_THRESHOLD,
}: SwipeableFlashcardProps): ReactNode {
  const [dragging, setDragging] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-8, 0, 8]);
  const leftOpacity = useTransform(x, [-swipeThreshold, -16, 0], [1, 0, 0]);
  const rightOpacity = useTransform(x, [0, 16, swipeThreshold], [0, 0, 1]);

  function handleDragEnd(_event: PointerEvent, info: PanInfo): void {
    setDragging(false);
    const { offset, velocity } = info;
    if (offset.x > swipeThreshold || velocity.x > VELOCITY_THRESHOLD) {
      onSwipeRight();
    } else if (offset.x < -swipeThreshold || velocity.x < -VELOCITY_THRESHOLD) {
      onSwipeLeft();
    }
  }

  function handleActivate(): void {
    if (Math.abs(x.get()) > 8) return;
    onToggleFlip();
  }

  return (
    <m.div
      key={cardKey}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
      style={{ x, rotate, perspective: 1000 }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={cn(
        'relative w-full max-w-2xl select-none',
        'touch-pan-y [-webkit-touch-callout:none] [-webkit-user-select:none]',
        dragging ? 'cursor-grabbing' : 'cursor-grab',
        className,
      )}
    >
      <m.span
        aria-hidden
        style={{ opacity: leftOpacity }}
        className="pointer-events-none absolute left-3 top-3 z-10 rounded-full border border-destructive/40 bg-destructive-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-destructive"
      >
        Forgot
      </m.span>
      <m.span
        aria-hidden
        style={{ opacity: rightOpacity }}
        className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-success/40 bg-success-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-success"
      >
        Got it
      </m.span>

      <m.div
        role="button"
        tabIndex={0}
        aria-label={flipped ? 'Show prompt side' : 'Reveal answer'}
        aria-pressed={flipped}
        onClick={handleActivate}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggleFlip();
          }
        }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className={cn('relative w-full transform-3d', 'min-h-56 sm:min-h-64')}
      >
        <CardFace>{front}</CardFace>
        <CardFace flipped>{back}</CardFace>
      </m.div>
    </m.div>
  );
}

function CardFace({
  children,
  flipped = false,
}: {
  children: ReactNode;
  flipped?: boolean;
}): ReactNode {
  return (
    <div
      className={cn(
        'inset-0 flex w-full flex-col justify-center rounded-2xl border bg-card p-6 shadow-sm sm:p-8',
        'backface-hidden [-webkit-backface-visibility:hidden]',
        flipped ? 'absolute transform-[rotateY(180deg)]' : 'relative',
      )}
    >
      {children}
    </div>
  );
}
