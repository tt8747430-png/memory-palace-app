'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@memory-palace/ui';
import { navItems, isNavItemActive } from '../nav';

/**
 * Floating "pill" tab bar styled after iOS/Notion mobile patterns.
 * Renders inside a fixed positioned <nav> from DashboardShell.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'mx-3 mb-[max(0.5rem,env(safe-area-inset-bottom))] flex h-14 items-center justify-around gap-1 px-2',
        'rounded-full border border-border/60 bg-background/85 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur',
        'supports-backdrop-filter:bg-background/70',
      )}
    >
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = isNavItemActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex min-h-touch min-w-touch flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1.5 transition-colors',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                active && 'bg-primary-soft',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} aria-hidden />
            </span>
            <span className="text-[0.625rem] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
