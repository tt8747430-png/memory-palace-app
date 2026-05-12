'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@memory-palace/ui';
import { isNavItemActive, sidebarFooterItems, sidebarPrimaryItems, type NavItem } from '../nav';
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
  /** Hook for the mobile drawer to close itself after a navigation tap. */
  onNavigate?: () => void;
}

export function Sidebar({ userProfile, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Workspace header */}
      <div className="px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        {userProfile ? (
          <ProfileMenu
            displayName={userProfile.displayName}
            avatarUrl={userProfile.avatarUrl}
            email={userProfile.email}
          />
        ) : (
          <Link
            href="/dashboard"
            className="block px-2 py-1.5 font-display text-sm font-semibold tracking-tight"
          >
            Memory Palace
          </Link>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-3 pt-3">
        <QuickActionsRow />
      </div>

      {/* Section divider */}
      <div className="mx-3 my-3 h-px bg-sidebar-border" aria-hidden />

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 px-3" aria-label="Main navigation">
        {sidebarPrimaryItems.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={isNavItemActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Footer: pinned utility links + theme toggle */}
      <div className="border-t border-sidebar-border px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <div className="space-y-0.5">
          {sidebarFooterItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isNavItemActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-end">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}

function SidebarLink({ item, active, onNavigate }: SidebarLinkProps): ReactNode {
  const { href, icon: Icon, label, badge } = item;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        active
          ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
      )}
    >
      {active ? (
        <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-primary" />
      ) : null}
      <Icon
        className={cn(
          'h-4.5 w-4.5 shrink-0 transition-colors',
          active ? 'text-foreground' : 'text-muted-foreground/80 group-hover:text-foreground',
        )}
        strokeWidth={active ? 2.25 : 2}
        aria-hidden
      />
      <span className="flex-1 truncate">{label}</span>
      {badge ? (
        <span className="ml-auto rounded-full bg-success-soft px-1.5 py-0.5 text-[0.6875rem] font-medium leading-none text-success">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
