'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/ui';
import { isNavItemActive, sidebarFooterItems, sidebarGroups, type NavItem } from '../nav';
import { useSidebarCollapsed } from '../useSidebarCollapsed';
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
  onNavigate?: () => void;
  forceExpanded?: boolean;
}

export function Sidebar({ userProfile, onNavigate, forceExpanded }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed: persistedCollapsed, toggle } = useSidebarCollapsed();
  const collapsed = forceExpanded ? false : persistedCollapsed;

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-full',
      )}
      data-collapsed={collapsed || undefined}
    >
      <div className={cn('px-3 pt-3', collapsed && 'px-2')}>
        {userProfile ? (
          <ProfileMenu
            displayName={userProfile.displayName}
            avatarUrl={userProfile.avatarUrl}
            email={userProfile.email}
            compact={collapsed}
          />
        ) : (
          <Link
            href="/dashboard"
            className={cn(
              'block rounded-md font-display text-sm font-semibold tracking-tight',
              collapsed ? 'px-1 py-1.5 text-center' : 'px-2 py-1.5',
            )}
            title={collapsed ? 'Memory Palace' : undefined}
          >
            {collapsed ? 'M' : 'Memory Palace'}
          </Link>
        )}
      </div>
      {!collapsed ? (
        <div className="px-3 pt-3">
          <QuickActionsRow />
        </div>
      ) : null}

      <div className="mx-3 my-3 h-px bg-sidebar-border" aria-hidden />

      <nav className="flex-1 overflow-y-auto px-3" aria-label="Main navigation">
        {sidebarGroups.map((group, idx) => (
          <div key={group.title ?? idx} className={cn(idx > 0 && 'mt-4')}>
            {group.title && !collapsed ? (
              <p
                className="px-3 pb-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground/70"
                id={`sidebar-group-${idx}`}
              >
                {group.title}
              </p>
            ) : null}
            <ul
              className="space-y-0.5"
              aria-labelledby={group.title && !collapsed ? `sidebar-group-${idx}` : undefined}
            >
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarLink
                    item={item}
                    active={isNavItemActive(pathname, item.href)}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('border-t border-sidebar-border px-3 pt-2 pb-2', collapsed && 'px-2')}>
        {collapsed ? (
          <ul className="space-y-0.5">
            {sidebarFooterItems.map((item) => (
              <li key={item.href}>
                <SidebarLink
                  item={item}
                  active={isNavItemActive(pathname, item.href)}
                  collapsed={true}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-1 rounded-lg">
            {sidebarFooterItems.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={isNavItemActive(pathname, item.href)}
                collapsed={false}
                onNavigate={onNavigate}
                className="flex-1"
              />
            ))}
            <ModeToggle />
          </div>
        )}

        {!forceExpanded ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            className={cn(
              'mt-1 hidden h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors md:flex',
              'hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              collapsed && 'justify-center px-0',
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="h-4.5 w-4.5" aria-hidden />
                <span>Collapse</span>
              </>
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  className?: string;
}

function SidebarLink({
  item,
  active,
  collapsed,
  onNavigate,
  className,
}: SidebarLinkProps): ReactNode {
  const { href, icon: Icon, label, badge } = item;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        'group relative flex items-center rounded-lg text-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        collapsed ? 'h-10 w-10 justify-center mx-auto' : 'gap-3 px-3 py-2',
        active
          ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
        className,
      )}
    >
      {active && !collapsed ? (
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
      {!collapsed ? (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge ? (
            <span className="ml-auto rounded-full bg-success-soft px-1.5 py-0.5 text-[0.6875rem] font-medium leading-none text-success">
              {badge}
            </span>
          ) : null}
        </>
      ) : badge ? (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-sidebar"
        />
      ) : null}
    </Link>
  );
}
