'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@memory-palace/ui';
import { navItems, isNavItemActive } from '../nav';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-bottom-nav items-center justify-around">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = isNavItemActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5',
              'min-w-touch min-h-touch',
              'transition-colors duration-150',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <span
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                active && 'bg-primary/12',
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            </span>
            <span className="text-[0.625rem] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
