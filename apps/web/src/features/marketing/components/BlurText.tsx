'use client';

import { m, useReducedMotion } from 'framer-motion';

type BlurTextProps = {
  text: string;
  className?: string;
  /** Stagger between words, in milliseconds. */
  delayMs?: number;
  /** Total per-word duration, in seconds. */
  durationS?: number;
};

/**
 * Word-by-word blur-in heading. Each word independently animates from
 * `blur(10px) opacity:0 y:50` through a midpoint to its final state, with a
 * stagger of `delayMs` per word index. Honors `prefers-reduced-motion` by
 * rendering the static text immediately.
 *
 * The parent must be flex-wrap so wrapping works at narrow widths; the
 * component uses `inline-block` words separated by `marginRight: 0.28em`
 * (a non-breaking-space gets squashed by negative letter-spacing).
 */
export function BlurText({ text, className, delayMs = 100, durationS = 0.7 }: BlurTextProps) {
  const reduced = useReducedMotion();
  const words = text.split(' ');

  return (
    <p
      className={className}
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', rowGap: '0.1em' }}
    >
      {words.map((word, i) => (
        <m.span
          key={i}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
          initial={reduced ? false : { filter: 'blur(10px)', opacity: 0, y: 50 }}
          whileInView={
            reduced
              ? undefined
              : {
                  filter: ['blur(10px)', 'blur(5px)', 'blur(0px)'],
                  opacity: [0, 0.5, 1],
                  y: [50, -5, 0],
                }
          }
          viewport={{ once: true, amount: 0.1 }}
          transition={{
            duration: durationS,
            times: [0, 0.5, 1],
            ease: 'easeOut',
            delay: (i * delayMs) / 1000,
          }}
        >
          {word}
        </m.span>
      ))}
    </p>
  );
}
