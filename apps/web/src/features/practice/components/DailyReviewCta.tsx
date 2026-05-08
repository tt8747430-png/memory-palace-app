import Link from 'next/link';
import { BrainCircuit, ArrowRight } from 'lucide-react';
import { buttonVariants, cn } from '@memory-palace/ui';
import { getDueNodes } from '../actions/getDueNodes';

/**
 * Dashboard CTA — pulls a single due node so the card reflects whether there
 * is anything to review right now. Lives next to `StatsBar` on the dashboard.
 */
export async function DailyReviewCta() {
  const result = await getDueNodes({ limit: 1 });
  const hasDue = result.success && result.data.length > 0;

  return (
    <section
      aria-labelledby="daily-review-heading"
      className={cn(
        'flex flex-col gap-3 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between',
        hasDue && 'border-primary/30 bg-primary/5',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <div>
          <h2 id="daily-review-heading" className="font-semibold">
            {hasDue ? 'Daily review' : 'No reviews due'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {hasDue
              ? 'Strengthen what you have learned with a quick session.'
              : 'You are all caught up — capture new nodes any time.'}
          </p>
        </div>
      </div>
      <Link
        href="/practice"
        className={cn(buttonVariants({ variant: hasDue ? 'primary' : 'outline', size: 'md' }))}
      >
        {hasDue ? 'Start review' : 'Open practice'} <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </section>
  );
}
