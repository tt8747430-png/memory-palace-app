'use client';

import { type ReactNode } from 'react';
import { cn } from '@/ui';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileDrawer } from './MobileDrawer';
import { ModeToggle } from './ModeToggle';
import { useSidebarCollapsed } from '../useSidebarCollapsed';
import { AppCommandProvider } from '@/shared/components/AppCommandProvider';
import { CommandPaletteTrigger } from '@/shared/components/CommandPaletteTrigger';

interface UserProfile {
  displayName: string;
  avatarUrl: string | null;
  email?: string | null;
}

interface DashboardShellProps {
  children: ReactNode;
  userProfile?: UserProfile | null;
}

export function DashboardShell({ children, userProfile }: DashboardShellProps) {
  const { collapsed } = useSidebarCollapsed();

  return (
    <AppCommandProvider>
      <div className="flex h-svh flex-col md:flex-row">
        <aside
          className={cn(
            'hidden md:flex md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar',
            'transition-[width] duration-200',
            collapsed ? 'md:w-16' : 'md:w-64',
          )}
          aria-label="Main navigation"
        >
          <Sidebar userProfile={userProfile} />
        </aside>

        <header className="fixed inset-x-0 top-0 z-50 flex h-[var(--height-top-bar)] items-end justify-between border-b border-border/60 bg-background/85 px-3 pb-2.5 backdrop-blur supports-backdrop-filter:bg-background/70 md:hidden">
          <div className="flex items-center gap-1">
            <MobileDrawer userProfile={userProfile} />
          </div>
          <h1 className="font-display text-base font-semibold tracking-tight">Memory Palace</h1>
          <div className="flex items-center gap-1">
            <CommandPaletteTrigger />
            <ModeToggle />
          </div>
        </header>

        <main
          id="main-content"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-[var(--height-top-bar)] pb-[var(--height-bottom-nav)] md:pt-0 md:pb-0"
        >
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>

        <nav
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden"
          aria-label="Bottom navigation"
        >
          <div className="pointer-events-auto">
            <BottomNav />
          </div>
        </nav>
      </div>
    </AppCommandProvider>
  );
}
