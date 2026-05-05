'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@memory-palace/ui';
import { navItems, isNavItemActive } from '../nav';
import { ModeToggle } from './ModeToggle';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Main navigation">
      <div className="mb-6 px-2 text-xl font-bold">🏛️ Memory Palace</div>
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = isNavItemActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-muted font-medium text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
      <div className="mt-auto flex items-center justify-end pt-4">
        <ModeToggle />
      </div>
    </nav>
  );
}
