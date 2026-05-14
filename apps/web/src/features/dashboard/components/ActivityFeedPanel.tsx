import { Activity } from 'lucide-react';
import { cn } from '@/ui';
import {
  describeEvent,
  eventIcon,
  eventTone,
  formatRelative,
  type ActivityEvent,
} from '../activity';

interface Props {
  events: ActivityEvent[];
  title?: string;
  emptyMessage?: string;
}

const TONE_BG: Record<ReturnType<typeof eventTone>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  muted: 'bg-muted text-muted-foreground',
};

export function ActivityFeedPanel({
  events,
  title = 'Activity',
  emptyMessage = 'No activity yet — practice to start building your timeline.',
}: Props) {
  return (
    <section className="rounded-2xl border bg-card shadow-sm" aria-labelledby="activity-heading">
      <header className="flex items-center justify-between border-b px-5 py-3">
        <h2 id="activity-heading" className="text-sm font-semibold tracking-tight">
          {title}
        </h2>
      </header>
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
          <Activity className="h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="divide-y">
          {events.map((event) => {
            const Icon = eventIcon(event.kind);
            const tone = eventTone(event.kind);
            return (
              <li key={event.id} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    TONE_BG[tone],
                  )}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{describeEvent(event)}</p>
                  <p className="text-xs text-muted-foreground">{formatRelative(event.at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
