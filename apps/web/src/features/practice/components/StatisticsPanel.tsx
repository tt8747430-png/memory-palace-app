'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, BarChart3, Clock, Flame, Target } from 'lucide-react';
import { cn } from '@memory-palace/ui';
import type { PracticeStats } from '../actions/getPracticeStats';

interface Props {
  stats: PracticeStats;
}

type Tab = 'overview' | 'weakest' | 'history' | 'activity';

const TABS: ReadonlyArray<{ id: Tab; label: string; Icon: typeof Activity }> = [
  { id: 'overview', label: 'Overview', Icon: BarChart3 },
  { id: 'weakest', label: 'Weakest', Icon: Target },
  { id: 'history', label: 'History', Icon: Clock },
  { id: 'activity', label: 'Activity', Icon: Activity },
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function bucketShade(value: number, max: number): string {
  if (value <= 0) return 'bg-muted';
  const ratio = max > 0 ? value / max : 0;
  if (ratio < 0.25) return 'bg-primary/20';
  if (ratio < 0.5) return 'bg-primary/40';
  if (ratio < 0.75) return 'bg-primary/60';
  if (ratio < 1) return 'bg-primary/80';
  return 'bg-primary';
}

function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

/**
 * Practice statistics dashboard widget. Lives in the practice feature (not
 * dashboard) because it imports `getPracticeStats` from this domain — the
 * boundaries plugin forbids dashboard → practice cross-feature imports.
 *
 * Charts are intentionally rendered with raw Tailwind cells (no Recharts
 * dependency) — see ADR 9B.
 */
export function StatisticsPanel({ stats }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const maxWeekly = Math.max(...stats.weeklyActivity, 0);
  const totalThisWeek = stats.weeklyActivity.reduce((a, b) => a + b, 0);

  // Resolve weekday labels for the 7-day strip — oldest → newest, ending today.
  const today = new Date();
  const weeklyLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return WEEKDAY_LABELS[d.getDay()] ?? '';
  });

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Practice statistics</h2>
          <p className="text-sm text-muted-foreground">
            {stats.totalPracticed} total attempt{stats.totalPracticed === 1 ? '' : 's'}
          </p>
        </div>
        <div className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
          <Flame className="h-4 w-4 text-amber-500" />
          <span className="tabular-nums font-medium">{stats.topStreak}</span>
          <span>top streak</span>
        </div>
      </header>

      <div role="tablist" aria-label="Statistics tabs" className="mb-4 flex gap-1 border-b">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors',
              tab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Attempts" value={stats.totalPracticed} />
          <Stat label="Top streak" value={stats.topStreak} suffix="✨" />
          <Stat label="This week" value={totalThisWeek} />
        </div>
      )}

      {tab === 'weakest' && (
        <div className="space-y-2">
          {stats.weakestNodes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No nodes practised yet.
            </p>
          ) : (
            stats.weakestNodes.map((node) => (
              <Link
                key={node.id}
                href={`/practice/${node.id}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <span className="truncate font-medium">{node.title}</span>
                <span className="ml-3 shrink-0 tabular-nums text-sm text-muted-foreground">
                  {Math.round(node.mastery * 100)}%
                </span>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'history' && (
        <ul className="space-y-2">
          {stats.recentSessions.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted-foreground">
              No practice history yet.
            </li>
          ) : (
            stats.recentSessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.nodeTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.mode} · {formatRelative(s.practicedAt)}
                  </p>
                </div>
                <span
                  className={cn(
                    'ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs tabular-nums',
                    s.correct
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                  )}
                >
                  {s.score}
                </span>
              </li>
            ))
          )}
        </ul>
      )}

      {tab === 'activity' && (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {totalThisWeek} attempt{totalThisWeek === 1 ? '' : 's'} in the last 7 days
          </p>
          <div
            className="grid grid-cols-7 gap-1.5"
            role="img"
            aria-label={`Weekly practice heatmap, ${totalThisWeek} attempts`}
          >
            {stats.weeklyActivity.map((value, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'h-12 w-full rounded-md transition-colors',
                    bucketShade(value, maxWeekly),
                  )}
                  title={`${weeklyLabels[i]}: ${value} attempt${value === 1 ? '' : 's'}`}
                />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {weeklyLabels[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {value}
        {suffix ? <span className="ml-1 text-base">{suffix}</span> : null}
      </p>
    </div>
  );
}
