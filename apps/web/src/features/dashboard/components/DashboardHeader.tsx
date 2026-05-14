import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { buttonVariants, cn } from '@memory-palace/ui';

interface Props {
  displayName: string;
  dueCount: number;
}

function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardHeader({ displayName, dueCount }: Props) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {today}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {greeting()}, {displayName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dueCount > 0
            ? `${dueCount} ${dueCount === 1 ? 'memory is' : 'memories are'} ready for review.`
            : 'You are all caught up. Add new memories or explore your palaces.'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {dueCount > 0 ? (
          <Link href="/practice" className={buttonVariants({ variant: 'primary', size: 'md' })}>
            Start review
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
          </Link>
        ) : null}
        <Link
          href="/palaces?action=create-palace"
          className={cn(
            buttonVariants({ variant: dueCount > 0 ? 'outline' : 'primary', size: 'md' }),
          )}
        >
          <Plus className="mr-1 h-4 w-4" aria-hidden />
          New palace
        </Link>
      </div>
    </header>
  );
}
