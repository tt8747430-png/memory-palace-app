import { Flame } from 'lucide-react';
import { getPracticeStats } from '../actions/getPracticeStats';

/**
 * Compact streak indicator showing the user's top per-node streak.
 * Lives in the practice feature; consumed by route files (e.g. the dashboard
 * page) rather than by other feature directories — keeps boundaries clean.
 */
export async function StreakCounter() {
  const result = await getPracticeStats();
  const top = result.success ? result.data.topStreak : 0;

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs"
      aria-label={`Top streak ${top}`}
    >
      <Flame
        className={top > 0 ? 'h-3.5 w-3.5 text-amber-500' : 'h-3.5 w-3.5 text-muted-foreground'}
      />
      <span className="tabular-nums font-medium">{top}</span>
      <span className="text-muted-foreground">streak</span>
    </div>
  );
}
