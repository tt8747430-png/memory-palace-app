'use client';

import { useState, type ReactNode } from 'react';
import { m, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { cn } from '@/ui';

/**
 * Tinder-style swipe + iOS-style 3D-flip flashcard primitive.
 *
 * - Drag horizontally to mark the card (left → `onSwipeLeft`, right → `onSwipeRight`).
 *   The card snaps back if the user releases before crossing the threshold.
 * - Tap / click / Space / Enter flips the card on the Y axis.
 *
 * Designed for iOS PWA: `touch-action: pan-y` reserves the horizontal axis for
 * our drag handler (preventing Safari's edge-swipe-back), text selection and
 * long-press callouts are disabled, and `-webkit-backface-visibility` is set
 * to avoid flicker during the 3D flip.
 */
export interface SwipeableFlashcardProps {
  /** Stable identity for the current card — drives the enter animation. */
  cardKey: string | number;
  front: ReactNode;
  back: ReactNode;
  flipped: boolean;
  onToggleFlip: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  className?: string;
  /** Pixel offset that must be crossed for a swipe to commit. */
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
    // Suppress flip if the gesture was actually a swipe.
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
        // Layout
        'relative w-full max-w-2xl select-none',
        // iOS PWA niceties
        'touch-pan-y [-webkit-touch-callout:none] [-webkit-user-select:none]',
        dragging ? 'cursor-grabbing' : 'cursor-grab',
        className,
      )}
    >
      {/* Swipe affordance overlays — sit above the card edges */}
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

      {/* 3D flip wrapper */}
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
        className={cn(
          'relative w-full transform-3d',
          // Min height that scales with viewport but stays tappable
          'min-h-56 sm:min-h-64',
        )}
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
