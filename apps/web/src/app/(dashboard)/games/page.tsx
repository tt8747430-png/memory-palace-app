import Link from 'next/link';
import { Suspense } from 'react';
import { ChevronRight, Footprints, Layers, Sparkles, Zap } from 'lucide-react';
import { Skeleton } from '@memory-palace/ui';
import { getPalaces } from '@/features/palaces';
import { DailyReviewCta } from '@/features/practice';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Games',
  description: 'Pick a learning mode and a palace to practice.',
};

interface GameMode {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const MODES: ReadonlyArray<GameMode> = [
  {
    href: '/practice',
    title: 'Daily review',
    description: 'Spaced-repetition queue across every palace. Mixed quiz formats.',
    icon: Sparkles,
    badge: 'SR',
  },
  {
    href: '/games/flashcards',
    title: 'Flashcards',
    description: 'Anki-style flip cards with self-rating. Pick any room or palace.',
    icon: Layers,
  },
  {
    href: '/games/quiz',
    title: 'Quiz',
    description: 'Multiple choice and typed recall, scoped to a single room.',
    icon: Zap,
  },
];

export default function GamesPage() {
  return (
    <div className="space-y-6 pb-(--height-bottom-nav) sm:space-y-8 md:pb-0">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Games</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a mode. Each game can be scoped to a single room, a palace, or your full review
          queue.
        </p>
      </header>

      <DailyReviewCta />

      <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <Link
              key={mode.href}
              href={mode.href}
              prefetch
              className="group flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <div className="flex items-start justify-between">
                <Icon className="h-6 w-6 text-primary" />
                {mode.badge ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                    {mode.badge}
                  </span>
                ) : null}
              </div>
              <div>
                <h2 className="font-semibold">{mode.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{mode.description}</p>
              </div>
              <span className="mt-auto inline-flex items-center text-xs text-muted-foreground transition-colors group-hover:text-primary">
                Start <ChevronRight className="ml-0.5 h-3 w-3" />
              </span>
            </Link>
          );
        })}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Practice by palace &amp; room</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Drill a single chapter at a time — useful when memorising sequential material.
        </p>
        <Suspense fallback={<Skeleton className="mt-4 h-32 rounded-lg" />}>
          <PalaceList />
        </Suspense>
      </section>
    </div>
  );
}

async function PalaceList() {
  const result = await getPalaces();
  const palaces = result.success ? result.data : [];

  if (palaces.length === 0) {
    return (
      <div className="mt-4 rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        No palaces yet —{' '}
        <Link href="/palaces" className="text-primary hover:underline">
          create one
        </Link>{' '}
        to populate your review queue.
      </div>
    );
  }

  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {palaces.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{p.title}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {p.mode === 'bible' ? 'Bible mode' : 'Simple mode'}
            </p>
          </div>
          <Link
            href={`/palaces/${p.id}`}
            className="inline-flex min-h-touch shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            <Footprints className="h-3.5 w-3.5" /> Open
          </Link>
        </li>
      ))}
    </ul>
  );
}
