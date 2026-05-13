'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@memory-palace/ui';
import { navItems, isNavItemActive } from '../nav';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="flex w-full flex-col border-t border-border/50 bg-background">
      <div className="flex h-[3.25rem] items-center justify-around px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isNavItemActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-touch flex-1 flex-col items-center justify-center gap-[3px] py-1',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'flex h-7 w-14 items-center justify-center rounded-full transition-colors duration-150',
                  active && 'bg-primary-soft',
                )}
              >
                <Icon
                  className="h-[1.375rem] w-[1.375rem]"
                  strokeWidth={active ? 2.5 : 2}
                  aria-hidden
                />
              </span>
              <span className="text-[0.625rem] font-medium leading-none tracking-tight">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* iOS safe area spacer */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
