import type { Metadata } from 'next';
import { AtSign, Calendar } from 'lucide-react';
import { getProfile, SettingsSection, SignOutButton } from '@/features/settings';

export const metadata: Metadata = { title: 'Account · Settings' };

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Unknown';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function SettingsAccountPage() {
  const result = await getProfile();
  const profile = result.success
    ? result.data
    : { email: null, createdAt: null as Date | null, displayName: '' };

  return (
    <div className="space-y-6">
      <SettingsSection title="Account" description="Identity and session for this user.">
        <dl className="divide-y rounded-lg border bg-muted/20">
          <div className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[auto_auto_1fr] sm:items-center">
            <AtSign className="mt-0.5 h-4 w-4 text-muted-foreground sm:mt-0" aria-hidden />
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="col-start-2 min-w-0 break-all text-sm font-medium sm:col-start-auto sm:text-right sm:break-normal sm:truncate">
              {profile.email ?? 'Unknown'}
            </dd>
          </div>
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 px-4 py-3 sm:grid-cols-[auto_auto_1fr]">
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
            <dt className="text-sm text-muted-foreground">Member since</dt>
            <dd className="col-start-2 text-sm font-medium tabular-nums sm:col-start-auto sm:text-right">
              {formatDate(profile.createdAt)}
            </dd>
          </div>
        </dl>
      </SettingsSection>

      <SettingsSection title="Session" description="Sign out on this device.">
        <SignOutButton />
      </SettingsSection>
    </div>
  );
}
