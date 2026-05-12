'use client';

import { cn } from '@memory-palace/ui';

export type JourneyStepperItem = {
  id: string;
  title: string;
};

export type JourneyStepperProps = {
  items: ReadonlyArray<JourneyStepperItem>;
  currentIndex: number;
  onJump: (index: number) => void;

  label?: string;
  className?: string;
};

export function JourneyStepper({
  items,
  currentIndex,
  onJump,
  label = 'Journey progress',
  className,
}: JourneyStepperProps) {
  return (
    <ol
      aria-label={label}
      className={cn(
        'flex flex-wrap items-center gap-1.5 md:gap-2 md:overflow-x-auto md:flex-nowrap',
        className,
      )}
    >
      {items.map((item, i) => {
        const isActive = i === currentIndex;
        const isCompleted = i < currentIndex;
        return (
          <li key={item.id} className="contents">
            <button
              type="button"
              aria-label={`Go to step ${i + 1}: ${item.title}`}
              aria-current={isActive ? 'step' : undefined}
              onClick={() => onJump(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                isActive
                  ? 'w-6 bg-primary'
                  : isCompleted
                    ? 'w-2 bg-primary/60'
                    : 'w-2 bg-muted-foreground/30',

                'md:hidden',
              )}
            />
            <button
              type="button"
              aria-label={`Go to step ${i + 1}: ${item.title}`}
              aria-current={isActive ? 'step' : undefined}
              onClick={() => onJump(i)}
              className={cn(
                'hidden md:inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : isCompleted
                    ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] tabular-nums',
                  isActive
                    ? 'bg-primary-foreground/20'
                    : isCompleted
                      ? 'bg-primary/20'
                      : 'bg-muted',
                )}
                aria-hidden
              >
                {i + 1}
              </span>
              <span className="max-w-40 truncate">{item.title}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
