import { DashboardShell } from '@/features/dashboard';

// Auth is enforced by src/proxy.ts (which redirects unauthenticated requests
// before this layout renders) and by RLS at the database layer. No second
// network round-trip here.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
