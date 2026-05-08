export const dynamic = 'force-dynamic';

import { DashboardShell } from '@/features/dashboard';
import { searchNodes } from '@/features/nodes';
import { getUserProfile } from '@/shared/lib/userProfile';
import { PageTransition } from '@/shared/components/PageTransition';
import { QueryProvider } from '@/shared/components/QueryProvider';
import { SearchProvider } from '@/shared/components/SearchContext';

// Auth is enforced by src/proxy.ts (which redirects unauthenticated requests
// before this layout renders) and by RLS at the database layer. No second
// network round-trip here.
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
