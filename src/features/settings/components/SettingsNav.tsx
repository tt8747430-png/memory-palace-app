'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, KeyRound, SlidersHorizontal, UserCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/ui';

type Section = {
  href: string;
  label: string;
  description: string;
  Icon: LucideIcon;
};

export const SETTINGS_SECTIONS: readonly Section[] = [
  {
    href: '/settings/profile',
    label: 'Profile',
    description: 'Display name and avatar',
    Icon: UserCircle,
  },
  {
    href: '/settings/preferences',
    label: 'Preferences',
    description: 'Theme and motion',
    Icon: SlidersHorizontal,
  },
  {
    href: '/settings/account',
    label: 'Account',
    description: 'Email and session',
    Icon: KeyRound,
  },
  {
    href: '/settings/data',
    label: 'Data',
    description: 'Export, import, danger zone',
    Icon: Database,
  },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings sections">
      {}
      <ul className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2 lg:hidden sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SETTINGS_SECTIONS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-touch items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      {}
      <ul className="hidden flex-col gap-1 lg:flex">
        {SETTINGS_SECTIONS.map(({ href, label, description, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
                  active
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon
                  className={cn('mt-0.5 h-4 w-4 shrink-0', active && 'text-primary')}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground/80">{description}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
