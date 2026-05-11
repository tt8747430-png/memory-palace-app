'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@memory-palace/ui';
import { navItems, isNavItemActive } from '../nav';
import { ModeToggle } from './ModeToggle';
import { ProfileMenu } from './ProfileMenu';
import { QuickActionsRow } from './QuickActionsRow';

interface UserProfile {
  displayName: string;
  avatarUrl: string | null;
  email?: string | null;
}

interface SidebarProps {
  userProfile?: UserProfile | null;
}

export function Sidebar({ userProfile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Brand mark — minimal identity, no duplicate of the footer profile. */}
      <div className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <Link
          href="/dashboard"
          className="font-display text-sm font-semibold tracking-tight text-foreground"
        >
          Memory Palace
        </Link>
      </div>

      {/* Quick actions — persistent ⌘K affordance. */}
      <div className="px-3 pb-3">
        <QuickActionsRow />
      </div>

      {/* Nav links — pill-selected, soft surface. */}
      <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isNavItemActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-muted/70 font-semibold text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  active ? 'text-primary' : 'text-muted-foreground/70',
                )}
                strokeWidth={active ? 2.25 : 2}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: profile menu + theme toggle. */}
      <div className="border-t px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="flex items-center gap-1">
          {userProfile ? (
            <ProfileMenu
              displayName={userProfile.displayName}
              avatarUrl={userProfile.avatarUrl}
              email={userProfile.email}
            />
          ) : null}
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
