import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@memory-palace/ui';
import { getProfile } from '@/features/settings';
import { ProfileForm, ExportDataCard, ImportDataCard } from '@/features/settings';

export const metadata = { title: 'Settings — Memory Palace' };

export default async function SettingsPage() {
  const result = await getProfile();

  const profile = result.success ? result.data : { displayName: '', avatarUrl: null, email: null };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile and preferences.</p>
      </div>

      {/* ── Profile ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Profile</h2>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription>Update your display name and avatar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              key={`${profile.displayName}-${profile.avatarUrl ?? ''}`}
              displayName={profile.displayName}
              avatarUrl={profile.avatarUrl ?? null}
              email={profile.email}
            />
          </CardContent>
        </Card>
      </section>

      {/* ── Data ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Data</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Export or restore your palace data.
          </p>
        </div>
        <ExportDataCard />
        <ImportDataCard />
      </section>
    </div>
  );
}
