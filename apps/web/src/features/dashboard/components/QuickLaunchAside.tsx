import Link from 'next/link';
import { Building2, ChevronRight, Download, PlayCircle, Upload } from 'lucide-react';
import { cn } from '@memory-palace/ui';

const ACTIONS = [
  {
    href: '/palaces?action=create-palace',
    label: 'New palace',
    description: 'Start a fresh memory palace',
    Icon: Building2,
  },
  {
    href: '/palaces?action=import',
    label: 'Import deck',
    description: 'Bring in flashcards or markdown',
    Icon: Upload,
  },
  {
    href: '/practice',
    label: 'Practice queue',
    description: 'Review what is due today',
    Icon: PlayCircle,
  },
  {
    href: '/settings/data',
    label: 'Export data',
    description: 'Download your palaces',
    Icon: Download,
  },
] as const;

export function QuickLaunchAside() {
  return (
    <section
      className="rounded-2xl border bg-card shadow-sm"
      aria-labelledby="quick-launch-heading"
    >
      <header className="border-b px-5 py-3">
        <h2 id="quick-launch-heading" className="text-sm font-semibold tracking-tight">
          Quick launch
        </h2>
      </header>
      <ul className="divide-y">
        {ACTIONS.map(({ href, label, description, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                'flex items-center gap-3 px-5 py-3 transition-colors',
                'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{label}</span>
                <span className="block truncate text-xs text-muted-foreground">{description}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
