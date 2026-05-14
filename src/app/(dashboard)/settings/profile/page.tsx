import type { Metadata } from 'next';
import { getUserProfile as getProfile } from '@/shared/lib/userProfile';
import { ProfileForm, SettingsSection } from '@/features/settings';

export const metadata: Metadata = { title: 'Profile · Settings' };

export default async function SettingsProfilePage() {
  const result = await getProfile();
  const profile = result.success ? result.data : { displayName: '', avatarUrl: null, email: null };
  return (
    <SettingsSection title="Profile" description="Update your display name and avatar.">
      <ProfileForm
        key={`${profile.displayName}-${profile.avatarUrl ?? ''}`}
        displayName={profile.displayName}
        avatarUrl={profile.avatarUrl ?? null}
        email={profile.email}
      />
    </SettingsSection>
  );
}
