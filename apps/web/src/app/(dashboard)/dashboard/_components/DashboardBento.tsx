import Link from 'next/link';
import { ArrowRight, BrainCircuit, Building2, DoorOpen, Flame, Sparkles } from 'lucide-react';
import { buttonVariants, cn } from '@memory-palace/ui';
import { Sparkline } from '@/shared/components/Sparkline';
import { getDashboardStats } from '@/features/dashboard/actions/getDashboardStats';
import { getRecentPalaces } from '@/features/dashboard/actions/getRecentPalaces';
import { getDueNodes } from '@/features/practice/actions/getDueNodes';
import { getPracticeStats } from '@/features/practice/actions/getPracticeStats';
import { getUserProfile } from '@/shared/lib/userProfile';

/**
 * Bento-grid dashboard composition. Replaces the prior flat stack of
 * WelcomeBanner + StreakCounter + DailyReviewCta + StatsBar + RecentPalaces
 * with a single 6-column responsive grid that fetches every section in
 * parallel (one server round-trip cost instead of five).
 *
 * Tile palette:
 *  A — Welcome hero (col-span 4, row-span 2): greeting + due-count + CTA
 *  B — Streak (col-span 2): flame, top per-node streak
 *  C — Activity sparkline (col-span 2): 7-day attempts in primary tone
 *  D/E/F — Palaces / Rooms / Nodes counts (col-span 2 each)
 *  G — Recent palaces (col-span 6): 2x2 grid of latest 4 palaces
 */
export async function DashboardBento() {
  const [profile, stats, due, recent, practice] = await Promise.all([
    getUserProfile(),
    getDashboardStats(),
    getDueNodes({ limit: 1 }),
    getRecentPalaces(),
    getPracticeStats(),
  ]);

  const name =
    profile.success && profile.data.displayName.trim() ? profile.data.displayName.trim() : 'there';
  const counts = stats.success ? stats.data : { palaceCount: 0, roomCount: 0, nodeCount: 0 };
  const dueCount = due.success ? due.data.length : 0;
  const hasDue = dueCount > 0;
  const recentPalaces = recent.success ? recent.data : [];
  const topStreak = practice.success ? practice.data.topStreak : 0;
  const weeklyActivity = practice.success ? practice.data.weeklyActivity : [];
  const totalThisWeek = weeklyActivity.reduce((a, b) => a + b, 0);
  const hasPalaces = counts.palaceCount > 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:gap-4">
      {/* A — Welcome hero */}
      <section
        aria-labelledby="dashboard-hero-heading"
        className={cn(
          'relative col-span-2 overflow-hidden rounded-2xl border bg-card p-6 shadow-sm',
          'sm:col-span-4 sm:row-span-2 sm:p-7',
          hasDue && 'border-primary/30 bg-linear-to-br from-primary/8 via-card to-card',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Welcome back
              </p>
              <h1
                id="dashboard-hero-heading"
                className="mt-1 text-2xl font-bold tracking-tight md:text-3xl"
              >
                {name} 👋
              </h1>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BrainCircuit className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            {hasDue
              ? `You have ${dueCount === 1 ? 'a node' : `${dueCount} nodes`} ready for review. A short session keeps the streak alive.`
              : hasPalaces
                ? 'You are all caught up — capture new memories or wander an existing palace.'
                : 'Your Memory Palace awaits. Build your first room to get started.'}
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
            {hasDue ? (
              <Link href="/practice" className={buttonVariants({ variant: 'primary', size: 'md' })}>
                Start review <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            ) : hasPalaces ? (
              <Link href="/practice" className={buttonVariants({ variant: 'outline', size: 'md' })}>
                Open practice <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/palaces?action=create-palace"
                className={buttonVariants({ variant: 'primary', size: 'md' })}
              >
                Create your first palace <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            )}
            <Link
              href="/games/flashcards"
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground',
                'transition-colors hover:bg-muted hover:text-foreground',
              )}
            >
              Flashcards <Sparkles className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* B — Streak */}
      <section
        aria-label="Top streak"
        className="col-span-1 flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-sm sm:col-span-2 sm:p-5"
      >
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Flame
            className={cn(
              'h-3.5 w-3.5',
              topStreak > 0 ? 'text-amber-500' : 'text-muted-foreground',
            )}
          />
          Streak
        </div>
        <div className="mt-3">
          <p className="text-3xl font-bold tabular-nums sm:text-4xl">{topStreak}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {topStreak > 0 ? 'top per-node streak' : 'practice to start a streak'}
          </p>
        </div>
      </section>

      {/* C — Weekly activity sparkline */}
      <section
        aria-label="Weekly review activity"
        className="col-span-1 flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-sm sm:col-span-2 sm:p-5"
      >
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span>This week</span>
          <span className="tabular-nums text-foreground">{totalThisWeek}</span>
        </div>
        <div className="mt-3 text-primary">
          {weeklyActivity.length >= 2 ? (
            <Sparkline
              values={weeklyActivity}
              width={160}
              height={40}
              className="h-10 w-full"
              fill
            />
          ) : (
            <div className="h-10 rounded-md bg-muted/40" aria-hidden />
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {totalThisWeek === 0 ? 'no activity yet' : 'attempts, last 7 days'}
          </p>
        </div>
      </section>

      {/* D — Palaces */}
      <CountTile
        href="/palaces"
        label="Palaces"
        value={counts.palaceCount}
        icon={<Building2 className="h-4 w-4" />}
      />

      {/* E — Rooms */}
      <CountTile
        href="/palaces"
        label="Rooms"
        value={counts.roomCount}
        icon={<DoorOpen className="h-4 w-4" />}
      />

      {/* F — Nodes */}
      <CountTile
        href="/palaces"
        label="Nodes"
        value={counts.nodeCount}
        icon={<Sparkles className="h-4 w-4" />}
      />

      {/* G — Recent palaces */}
      {recentPalaces.length > 0 ? (
        <section
          aria-labelledby="recent-palaces-heading"
          className="col-span-2 rounded-2xl border bg-card p-5 shadow-sm sm:col-span-6"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="recent-palaces-heading"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Recent palaces
            </h2>
            <Link
              href="/palaces"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentPalaces.map((p) => (
              <Link
                key={p.id}
                href={`/palaces/${p.id}`}
                className={cn(
                  'group rounded-xl border bg-background/40 p-4 transition-all',
                  'hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/40 hover:shadow-md',
                  'motion-reduce:hover:translate-y-0',
                )}
              >
                <p className="truncate font-medium group-hover:text-primary">{p.title}</p>
                {p.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground/60">No description</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section
          className="col-span-2 rounded-2xl border border-dashed bg-card/40 p-6 text-center shadow-sm sm:col-span-6"
          aria-label="No palaces yet"
        >
          <Building2 className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">No palaces yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first Memory Palace to start organizing knowledge spatially.
          </p>
          <Link
            href="/palaces?action=create-palace"
            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-3')}
          >
            Create a palace
          </Link>
        </section>
      )}
    </div>
  );
}

function CountTile({
  href,
  label,
  value,
  icon,
}: {
  href: string;
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group col-span-1 flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-sm transition-all sm:col-span-2 sm:p-5',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md motion-reduce:hover:translate-y-0',
      )}
    >
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className="text-muted-foreground/70 group-hover:text-primary">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums sm:text-4xl">{value}</p>
    </Link>
  );
}
