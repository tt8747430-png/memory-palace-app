import { DashboardShell } from '@/features/dashboard';
import { getUserProfile } from '@/shared/lib/userProfile';

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

  return <DashboardShell userProfile={userProfile}>{children}</DashboardShell>;
}
