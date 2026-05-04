'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Gamepad2, Trophy, Map } from 'lucide-react';
import { cn } from '@memory-palace/ui';

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/daily', icon: Calendar, label: 'Daily' },
  { href: '/games', icon: Gamepad2, label: 'Games' },
  { href: '/progress', icon: Trophy, label: 'Progress' },
  { href: '/palace', icon: Map, label: 'Palaces' },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-bottom-nav items-center justify-around">
      {tabs.map(({ href, icon: Icon, label }) => {
        const isActive =
          href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-2',
              'min-w-touch min-h-touch',
              'transition-colors duration-150',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[0.625rem] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
