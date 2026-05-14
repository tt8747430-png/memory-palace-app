import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/ui';
import { getDueNodes, PracticePicker } from '@/features/practice';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'Review your memory palace nodes with spaced repetition.',
};

export default function PracticePage() {
  return (
    <div className="space-y-6 pb-(--height-bottom-nav) md:pb-0">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Practice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Spaced repetition keeps memory fresh. Pick a node to start a quiz.
        </p>
      </header>

      <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
        <DueQueue />
      </Suspense>

      <p className="text-sm text-muted-foreground">
        New here?{' '}
        <Link href="/palaces" className="text-primary hover:underline">
          Create a palace
        </Link>{' '}
        and add nodes to populate your review queue.
      </p>
    </div>
  );
}

async function DueQueue() {
  const result = await getDueNodes({ limit: 30 });
  const due = result.success ? result.data : [];
  return <PracticePicker due={due} />;
}
