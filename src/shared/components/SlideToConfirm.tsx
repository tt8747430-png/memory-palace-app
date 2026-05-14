'use client';

import { useRef, useState } from 'react';
import { LazyMotion, MotionConfig, domAnimation, m, useMotionValue, animate } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/ui';

export type SlideToConfirmProps = {
  onConfirmAction: () => void;

  label: string;

  confirmedLabel?: string;
  className?: string;

  tone?: 'destructive' | 'primary';
  disabled?: boolean;
};

const TRACK_HEIGHT = 56;
const THUMB_SIZE = 48;
const COMPLETE_RATIO = 0.92;

void TRACK_HEIGHT;

const TONE_TRACK: Record<NonNullable<SlideToConfirmProps['tone']>, string> = {
  destructive: 'bg-destructive/15 text-destructive',
  primary: 'bg-primary/15 text-primary',
};

const TONE_THUMB: Record<NonNullable<SlideToConfirmProps['tone']>, string> = {
  destructive: 'bg-destructive text-destructive-foreground',
  primary: 'bg-primary text-primary-foreground',
};

export function SlideToConfirm({
  onConfirmAction,
  label,
  confirmedLabel,
  className,
  tone = 'destructive',
  disabled = false,
}: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [confirmed, setConfirmed] = useState(false);

  function handleDragEnd() {
    if (confirmed) return;
    const trackWidth = trackRef.current?.clientWidth ?? 0;
    const maxX = trackWidth - THUMB_SIZE - 8;
    const ratio = maxX > 0 ? x.get() / maxX : 0;
    if (ratio >= COMPLETE_RATIO) {
      animate(x, maxX, { duration: 0.15 });
      setConfirmed(true);
      onConfirmAction();
    } else {
      animate(x, 0, { type: 'spring', stiffness: 320, damping: 30 });
    }
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div
          ref={trackRef}
          className={cn(
            'relative h-14 w-full select-none overflow-hidden rounded-full',
            TONE_TRACK[tone],
            disabled && 'opacity-50',
            className,
          )}
          {...(disabled ? { 'aria-disabled': true } : {})}
        >
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium"
            aria-live="polite"
          >
            {confirmed ? (confirmedLabel ?? label) : label}
          </span>

          <m.button
            type="button"
            drag={disabled || confirmed ? false : 'x'}
            dragConstraints={trackRef}
            dragElastic={0}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            style={{ x }}
            className={cn(
              'absolute left-1 top-1 flex h-12 w-12 cursor-grab items-center justify-center rounded-full shadow-md active:cursor-grabbing',
              TONE_THUMB[tone],
            )}
            aria-label={label}
            disabled={disabled || confirmed}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight aria-hidden className="h-5 w-5" />
          </m.button>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
