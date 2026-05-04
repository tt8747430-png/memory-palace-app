'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  Map,
  Gamepad2,
  Trophy,
  BookOpen,
  FileText,
  Search,
  Settings,
  User,
} from 'lucide-react';
import { cn } from '@memory-palace/ui';

const items = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/daily', icon: Calendar, label: 'Daily Review' },
  { href: '/palace', icon: Map, label: 'Palaces' },
  { href: '/games', icon: Gamepad2, label: 'Games' },
  { href: '/progress', icon: Trophy, label: 'Progress' },
  { href: '/study', icon: BookOpen, label: 'Study' },
  { href: '/review', icon: FileText, label: 'Review Generator' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/profile', icon: User, label: 'Profile' },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Main navigation">
      <div className="mb-6 px-2 text-xl font-bold">🏛️ Memory Palace</div>
      {items.map(({ href, icon: Icon, label }) => {
        const isActive =
          href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-muted font-medium text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
