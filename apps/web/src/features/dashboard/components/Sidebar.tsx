'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@memory-palace/ui';
import { navItems, isNavItemActive } from '../nav';
import { ModeToggle } from './ModeToggle';

interface UserProfile {
  displayName: string;
  avatarUrl: string | null;
}

interface SidebarProps {
  userProfile?: UserProfile | null;
}

function SidebarAvatar({ displayName, avatarUrl }: UserProfile) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${displayName} avatar`}
          className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-1 ring-border"
        >
          {initials || '?'}
        </div>
      )}
      <span className="truncate text-sm font-medium">{displayName}</span>
    </div>
  );
}

export function Sidebar({ userProfile }: SidebarProps) {
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
      <div className="mt-auto border-t pt-3">
        {userProfile ? <SidebarAvatar {...userProfile} /> : null}
        <div className="flex items-center justify-end px-2 pt-1">
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}
