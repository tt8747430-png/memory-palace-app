export const dynamic = 'force-dynamic';

import { DashboardShell } from '@/features/dashboard';
import { searchNodes } from '@/features/nodes';
import { getUserProfile } from '@/shared/lib/userProfile';
import { PageTransition } from '@/shared/components/PageTransition';
import { QueryProvider } from '@/shared/components/QueryProvider';
import { SearchProvider } from '@/shared/components/SearchContext';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const result = await getUserProfile();
  const userProfile = result.success
    ? {
        displayName: result.data.displayName,
        avatarUrl: result.data.avatarUrl ?? null,
        email: result.data.email,
      }
    : null;

  return (
    <QueryProvider>
      <SearchProvider value={searchNodes}>
        <DashboardShell userProfile={userProfile}>
          <PageTransition>{children}</PageTransition>
        </DashboardShell>
      </SearchProvider>
    </QueryProvider>
  );
}
