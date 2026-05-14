import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { buttonVariants, cn } from '@/ui';

export type DuePracticeItem = {
  id: string;
  title: string;
  roomTitle: string;
  palaceTitle: string;
};

interface Props {
  dueNodes: DuePracticeItem[];
  totalDue?: number;
}

export function DuePracticeAside({ dueNodes, totalDue }: Props) {
  const total = totalDue ?? dueNodes.length;
  return (
    <section
      className="rounded-2xl border bg-card shadow-sm"
      aria-labelledby="due-practice-heading"
    >
      <header className="flex items-center justify-between border-b px-5 py-3">
        <h2 id="due-practice-heading" className="text-sm font-semibold tracking-tight">
          Due for review
        </h2>
        {total > 0 ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium tabular-nums text-primary">
            {total}
          </span>
        ) : null}
      </header>
      {dueNodes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" aria-hidden />
          <p className="text-sm font-medium">All caught up</p>
          <p className="text-xs text-muted-foreground">No reviews due. Add new memories to grow.</p>
        </div>
      ) : (
        <>
          <ul className="divide-y">
            {dueNodes.map((node) => (
              <li key={node.id}>
                <Link
                  href={`/practice/${node.id}`}
                  className={cn(
                    'flex items-start gap-2 px-5 py-3 transition-colors',
                    'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{node.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {node.roomTitle} · {node.palaceTitle}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t px-5 py-3">
            <Link
              href="/practice"
              className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'w-full')}
            >
              Start review
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
