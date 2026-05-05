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

function UserChip({ displayName, avatarUrl }: UserProfile) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          aria-hidden="true"
          className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[0.625rem] font-semibold text-muted-foreground ring-1 ring-border"
        >
          {initials || '?'}
        </div>
      )}
      <span className="min-w-0 truncate text-sm font-medium leading-none">{displayName}</span>
    </div>
  );
}

export function Sidebar({ userProfile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="px-6 py-5 text-lg font-bold tracking-tight">🏛️ Memory Palace</div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 px-3" aria-label="Main navigation">
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
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: user chip + theme toggle on the same row */}
      <div className="border-t px-3 py-3">
        <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5">
          {userProfile ? <UserChip {...userProfile} /> : null}
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
