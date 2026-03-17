import { redirect } from 'next/navigation';
import { auth } from '@/shared/lib/supabase-server';
// Server-side auth guard for all routes inside (dashboard).
// The middleware already redirects unauthenticated users, but this provides
// a defense-in-depth check at the layout level.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const {
    data: { user },
  } = await auth();
  if (!user) {
    redirect('/login');
  }
  return <>{children}</>;
}
