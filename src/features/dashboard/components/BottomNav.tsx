'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { m } from 'framer-motion';
import { cn } from '@/ui';
import { navItems, isNavItemActive } from '../nav';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="flex w-full flex-col border-t border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex h-15 items-stretch px-1">
        {navItems.map((item) => (
          <TabLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} />
        ))}
      </div>
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
