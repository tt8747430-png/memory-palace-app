import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileDrawer } from './MobileDrawer';
import { ModeToggle } from './ModeToggle';
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
  return (
    <AppCommandProvider>
      <div className="flex h-dvh flex-col md:flex-row">
        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar"
          aria-label="Main navigation"
        >
          <Sidebar userProfile={userProfile} />
        </aside>

        {/*
         * Mobile top bar — fixed above the content (chrome, not flow).
         * Its height (top safe-area + 3.5rem of body) is reserved on <main>
         * via the matching `pt-[…]` value below.
         */}
        <header className="fixed inset-x-0 top-0 z-50 flex h-[calc(env(safe-area-inset-top)+var(--height-top-bar))] items-end justify-between border-b border-border/60 bg-background/85 px-4 pb-2.5 backdrop-blur supports-backdrop-filter:bg-background/70 md:hidden">
          <MobileDrawer userProfile={userProfile} />
          <h1 className="text-lg font-semibold tracking-tight">Memory Palace</h1>
          <div className="flex items-center gap-1">
            <CommandPaletteTrigger />
            <ModeToggle />
          </div>
        </header>

        <main
          id="main-content"
          className="flex-1 overflow-y-auto pt-[calc(env(safe-area-inset-top)+var(--height-top-bar))] pb-[calc(var(--height-bottom-nav)+env(safe-area-inset-bottom))] md:pt-0 md:pb-0"
        >
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>

        {/* Floating pill bottom nav (mobile only) — also fixed chrome */}
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
