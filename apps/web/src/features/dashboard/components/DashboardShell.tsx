'use client';

import { type ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@memory-palace/ui';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileDrawer } from './MobileDrawer';
import { ModeToggle } from './ModeToggle';

interface UserProfile {
  displayName: string;
  avatarUrl: string | null;
}

interface DashboardShellProps {
  children: ReactNode;
  userProfile?: UserProfile | null;
}

export function DashboardShell({ children, userProfile }: DashboardShellProps) {
  return (
    <div className="flex h-dvh flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:w-64 md:flex-col md:border-r"
        aria-label="Main navigation"
      >
        <Sidebar userProfile={userProfile} />
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
        <MobileDrawer userProfile={userProfile} />
        <h1 className="text-lg font-semibold">Memory Palace</h1>
        <div className="flex items-center gap-1">
          <ModeToggle />
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-[calc(var(--height-bottom-nav)+env(safe-area-inset-bottom))] md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-safe-bottom md:hidden"
        aria-label="Bottom navigation"
      >
        <BottomNav />
      </nav>
    </div>
  );
}
