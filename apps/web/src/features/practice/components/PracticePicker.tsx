import Link from 'next/link';
import { Button } from '@memory-palace/ui';
import { ChevronRight, Flame } from 'lucide-react';
import type { DueNodeWithMeta } from '../actions/getDueNodes';

interface Props {
  due: DueNodeWithMeta[];
}

/**
 * Renders the list of due nodes with mastery badges and links to start a quiz.
 * Server component — renders deterministically from the action result.
 */
export function PracticePicker({ due }: Props) {
  if (due.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        No nodes are due right now. Capture more or come back tomorrow.
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border bg-card">
      {due.map((node) => (
        <li
          key={node.id}
          className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{node.title}</p>
              {node.neverPracticed ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                  New
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Due now
                </span>
              )}
              {node.streak >= 3 ? (
                <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                  <Flame className="h-3 w-3" /> {node.streak}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {node.palaceTitle} · {node.roomTitle} · {Math.round(node.mastery)}% mastery
            </p>
          </div>
          <Link href={`/practice/${node.id}`} prefetch>
            <Button size="sm" variant="outline">
              Quiz <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </li>
      ))}
    </ul>
  );
}
