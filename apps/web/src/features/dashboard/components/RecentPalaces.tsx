import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import { cn } from '@memory-palace/ui';
import { getDb, palaces, eq, isNull, and, desc } from '@memory-palace/db';
import { getCurrentUser } from '@/shared/lib/supabase';
import { EmptyState } from '@/shared/components/EmptyState';

async function fetchRecentPalaces(userId: string) {
  return getDb()
    .select({ id: palaces.id, title: palaces.title, description: palaces.description })
    .from(palaces)
    .where(and(eq(palaces.userId, userId), isNull(palaces.deletedAt)))
    .orderBy(desc(palaces.createdAt))
    .limit(4);
}

export async function RecentPalaces() {
  const user = await getCurrentUser();
  const items = user ? await fetchRecentPalaces(user.id) : [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Building2 />}
        title="No palaces yet"
        description="Create your first Memory Palace to start organizing your knowledge spatially."
        headingLevel={3}
        action={
          <Link
            href="/palaces"
            className={cn(
              'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
              'bg-primary text-primary-foreground transition-opacity hover:opacity-90',
            )}
          >
            Create a palace
          </Link>
        }
      />
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Palaces
        </h2>
        <Link
          href="/palaces"
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground',
            'transition-colors hover:bg-muted hover:text-foreground',
          )}
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((palace) => (
          <Link
            key={palace.id}
            href={`/palaces/${palace.id}`}
            className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/40"
          >
            <p className="font-medium group-hover:text-primary">{palace.title}</p>
            {palace.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {palace.description}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
