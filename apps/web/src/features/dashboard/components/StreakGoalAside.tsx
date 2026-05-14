import { Flame } from 'lucide-react';
import { cn } from '@/ui';
import { AreaChart } from '@/shared/components/AreaChart';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

interface Props {
  weeklyActivity: number[];
  topStreak: number;
  dailyGoal?: number;
}

export function StreakGoalAside({ weeklyActivity, topStreak, dailyGoal = 5 }: Props) {
  const todayCount = weeklyActivity.at(-1) ?? 0;
  const totalThisWeek = weeklyActivity.reduce((a, b) => a + b, 0);
  const goalPct = Math.min(100, Math.round((todayCount / dailyGoal) * 100));

  return (
    <section className="rounded-2xl border bg-card shadow-sm" aria-labelledby="streak-goal-heading">
      <header className="flex items-center justify-between border-b px-5 py-3">
        <h2 id="streak-goal-heading" className="text-sm font-semibold tracking-tight">
          This week
        </h2>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-amber-500" aria-hidden />
          <span className="tabular-nums font-medium text-foreground">{topStreak}</span>
          <span>top streak</span>
        </span>
      </header>
      <div className="px-5 py-4">
        <div className="text-primary">
          <AreaChart
            values={weeklyActivity}
            labels={WEEKDAY_LABELS}
            width={240}
            height={56}
            className="h-14 w-full"
            label={`Weekly attempts: ${totalThisWeek}`}
            valueUnit={{ singular: 'attempt', plural: 'attempts' }}
          />
        </div>
        <div className="mt-4">
          <div className="flex items-end justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Daily goal
            </p>
            <p className="text-xs tabular-nums text-muted-foreground">
              <span className="font-medium text-foreground">{todayCount}</span> / {dailyGoal}
            </p>
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={goalPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Daily practice goal progress"
          >
            <div
              className={cn(
                'h-full rounded-full bg-primary transition-[width] duration-500',
                'motion-reduce:transition-none',
              )}
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
