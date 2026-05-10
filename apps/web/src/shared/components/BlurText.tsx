'use client';

import { m } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@memory-palace/ui';

/**
 * Word-by-word blur-in reveal driven by IntersectionObserver.
 *
 * Adapted from the backgroundgallery reference. Plays once on first
 * intersection. Honoured by global `MotionConfig reducedMotion="user"` —
 * users with the reduced-motion preference see the final state instantly
 * via framer-motion's built-in reducer.
 */
export function BlurText({
  text,
  as: Tag = 'span',
  className,
  perWordDelay = 60,
  stepDuration = 0.5,
  startDelay = 0,
  rootMargin = '0px',
  threshold = 0.1,
}: {
  text: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  /** Per-word stagger in ms. */
  perWordDelay?: number;
  /** Duration of each keyframe step (in seconds). */
  stepDuration?: number;
  /** Initial delay (in seconds) before the first word animates. */
  startDelay?: number;
  rootMargin?: string;
  threshold?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const words = useMemo(() => text.split(' '), [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  const from = { filter: 'blur(12px)', opacity: 0, y: 30 };
  const keyframes = {
    filter: ['blur(12px)', 'blur(4px)', 'blur(0px)'],
    opacity: [0, 0.7, 1],
    y: [30, 8, 0],
  };

  return (
    <Tag ref={ref as never} className={cn('inline', className)}>
      {words.map((word, i) => (
        <m.span
          key={`${word}-${i}`}
          className="inline-block will-change-[transform,filter,opacity]"
          initial={from}
          animate={inView ? keyframes : from}
          transition={{
            duration: stepDuration,
            times: [0, 0.5, 1],
            delay: startDelay + (i * perWordDelay) / 1000,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {word}
          {i < words.length - 1 && '\u00A0'}
        </m.span>
      ))}
    </Tag>
  );
}
