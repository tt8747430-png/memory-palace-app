import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import { buttonVariants, cn } from '@memory-palace/ui';
import type { RecentPalace } from '../actions/getRecentPalaces';
import { formatRelative } from '../activity';

interface Props {
  palaces: RecentPalace[];
}

export function RecentPalacesPanel({ palaces }: Props) {
  if (palaces.length === 0) {
    return (
      <section
        className="rounded-2xl border border-dashed bg-card/40 p-6 text-center shadow-sm"
        aria-label="No palaces yet"
      >
        <Building2 className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
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
    );
  }

  return (
    <section
      aria-labelledby="recent-palaces-heading"
      className="rounded-2xl border bg-card shadow-sm"
    >
      <header className="flex items-center justify-between border-b px-5 py-3">
        <h2 id="recent-palaces-heading" className="text-sm font-semibold tracking-tight">
          Recent palaces
        </h2>
        <Link
          href="/palaces"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </header>
      <ul className="divide-y">
        {palaces.map((palace) => (
          <li key={palace.id}>
            <Link
              href={`/palaces/${palace.id}`}
              className={cn(
                'grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3 transition-colors',
                'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                aria-hidden
              >
                <Building2 className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{palace.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {palace.roomCount} {palace.roomCount === 1 ? 'room' : 'rooms'} ·{' '}
                  {palace.nodeCount} {palace.nodeCount === 1 ? 'node' : 'nodes'}
                  {palace.lastPracticedAt
                    ? ` · practiced ${formatRelative(palace.lastPracticedAt)}`
                    : ' · never practiced'}
                </span>
              </span>
              <ArrowRight
                className="h-4 w-4 text-muted-foreground/60 transition-colors group-hover:text-primary"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
