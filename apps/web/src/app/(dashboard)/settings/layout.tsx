import type { ReactNode } from 'react';
import { SettingsNav } from '@/features/settings';

export const metadata = {
  title: 'Settings',
  description: 'Manage your profile, preferences, account, and data.',
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6 pb-(--height-bottom-nav) sm:space-y-8 md:pb-0">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, preferences, account, and data.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SettingsNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
