'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { m } from 'framer-motion';
import { cn } from '@/ui';
import { navItems, isNavItemActive } from '../nav';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      data-testid="bottom-nav-pill"
      className={cn(
        'mx-auto flex h-14 max-w-sm items-stretch gap-1 rounded-full px-1.5',
        'border border-border/40 bg-background/65 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]',
        'supports-[backdrop-filter]:bg-background/40 supports-[backdrop-filter]:backdrop-blur-2xl',
        'supports-[backdrop-filter]:backdrop-saturate-150',
      )}
    >
      {navItems.map((item) => (
        <TabLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} />
      ))}
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
        'relative flex min-w-touch min-h-touch flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2',
        'transition-colors duration-150',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {active ? (
        <m.span
          layoutId="bottom-nav-pill"
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary-soft"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      ) : null}
      <Icon className="relative h-5.5 w-5.5" strokeWidth={active ? 2.5 : 2} aria-hidden />
      <span className="relative text-[0.625rem] font-medium leading-none tracking-tight">
        {label}
      </span>
    </Link>
  );
}
