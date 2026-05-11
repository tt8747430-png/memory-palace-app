import { cn } from '@memory-palace/ui';
import type { ReactNode } from 'react';

export type SoftCardSectionProps = {
  /** Optional eyebrow above the title. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Optional id used as the scroll anchor. */
  id?: string;
  children: ReactNode;
  className?: string;
  /** Tone for the card surface; defaults to "card". */
  tone?: 'card' | 'muted' | 'glass';
};

const TONE: Record<NonNullable<SoftCardSectionProps['tone']>, string> = {
  card: 'bg-card/70 border-border/60',
  muted: 'bg-muted/30 border-border/40',
  glass: 'bg-card/40 border-border/30 backdrop-blur-xl',
};

/**
 * Marketing-section wrapper that gives any inner block the "soft card"
 * surface from Figma references (Design_2026 / VibeCodedSaas / Software_Sections).
 *
 * - Rounded 3xl outer card with a 1px inset highlight
 * - Soft shadow with a tinted accent on dark mode
 * - Spacious vertical rhythm, mobile-first paddings
 *
 * Composable: any direct child renders inside the padded surface; the wrapper
 * supplies eyebrow + title + optional description above the children.
 */
export function SoftCardSection({
  eyebrow,
  title,
  description,
  id,
  children,
  className,
  tone = 'card',
}: SoftCardSectionProps) {
  return (
    <section id={id} className={cn('relative px-4 py-12 sm:px-6 md:py-20 lg:py-24', className)}>
      <div
        className={cn(
          'mx-auto max-w-6xl rounded-3xl border p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_60px_-30px_rgba(0,0,0,0.45)] sm:p-10 md:p-14',
          TONE[tone],
        )}
      >
        <header className="mb-8 max-w-2xl md:mb-12">
          {eyebrow ? (
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 text-base text-muted-foreground md:text-lg">{description}</p>
          ) : null}
        </header>
        <div>{children}</div>
      </div>
    </section>
  );
}
