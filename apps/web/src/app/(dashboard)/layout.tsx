import { DashboardShell } from '@/features/dashboard';
import { getProfile } from '@/features/settings';

// Auth is enforced by src/proxy.ts (which redirects unauthenticated requests
// before this layout renders) and by RLS at the database layer. No second
// network round-trip here.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const result = await getProfile();
  const userProfile = result.success
    ? { displayName: result.data.displayName, avatarUrl: result.data.avatarUrl ?? null }
    : null;

  return <DashboardShell userProfile={userProfile}>{children}</DashboardShell>;
}
