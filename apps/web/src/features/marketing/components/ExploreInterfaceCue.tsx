'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';
import { cn } from '@memory-palace/ui';

export type ExploreInterfaceCueProps = {
  label?: string;
  className?: string;
};

/**
 * Decorative "explore the interface" cue from the Figma EveryUIConcept /
 * VibeCodedSaas references — a floating chip with a soft cursor glyph and a
 * pulsing dot that nudges users to keep scrolling / hover the preview.
 *
 * Pure decoration: pointer-events-none, aria-hidden. Pulse honors
 * prefers-reduced-motion via the global MotionConfig.
 */
export function ExploreInterfaceCue({
  label = 'Explore the interface',
  className,
}: ExploreInterfaceCueProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        aria-hidden
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cn(
          'pointer-events-none inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur',
          className,
        )}
      >
        <span className="relative inline-flex h-2 w-2">
          <m.span
            className="absolute inset-0 rounded-full bg-primary/50"
            animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative inline-block h-2 w-2 rounded-full bg-primary" />
        </span>
        <MousePointer2 className="h-3.5 w-3.5" />
        <span>{label}</span>
      </m.div>
    </LazyMotion>
  );
}
