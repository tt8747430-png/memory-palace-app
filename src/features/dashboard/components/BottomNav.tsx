'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { m } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/ui';
import { navItems, isNavItemActive } from '../nav';
import { useFABAction } from '../useFABAction';

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { label, href } = useFABAction(pathname);

  return (
    <div className="flex w-full flex-col border-t border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="relative flex h-15 items-stretch px-1">
        <div className="flex flex-1 items-stretch">
          {navItems.slice(0, 2).map((item) => (
            <TabLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} />
          ))}
        </div>

        <div className="relative w-14 shrink-0">
          <button
            type="button"
            onClick={() => router.push(href)}
            aria-label={label}
            className={cn(
              'absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3',
              'flex h-14 w-14 items-center justify-center rounded-full',
              'bg-primary text-primary-foreground shadow-lg shadow-primary/25',
              'transition-transform duration-100 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            )}
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        <div className="flex flex-1 items-stretch">
          {navItems.slice(2, 4).map((item) => (
            <TabLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} />
          ))}
        </div>
      </div>

      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}

function TabLink({ item, active }: { item: (typeof navItems)[number]; active: boolean }) {
  const { href, icon: Icon, label } = item;
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex min-w-touch min-h-touch flex-1 flex-col items-center justify-center gap-0.75 py-1',
        'transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <span aria-hidden className="relative flex h-7 w-14 items-center justify-center">
        {active ? (
          <m.span
            layoutId="bottom-nav-pill"
            className="absolute inset-0 rounded-full bg-primary-soft"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        ) : null}
        <Icon className="relative h-5.5 w-5.5" strokeWidth={active ? 2.5 : 2} aria-hidden />
      </span>
      <span className="text-[0.625rem] font-medium leading-none tracking-tight">{label}</span>
    </Link>
  );
}
