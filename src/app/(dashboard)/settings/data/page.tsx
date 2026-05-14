import type { Metadata } from 'next';
import { Alert, AlertDescription, AlertTitle } from '@/ui';
import { SettingsSection } from '@/features/settings';
import { ExportButton, ImportDialog } from '@/features/palaces';

export const metadata: Metadata = { title: 'Data · Settings' };

export default function SettingsDataPage() {
  return (
    <div className="space-y-6">
      <SettingsSection
        title="Export"
        description="Download every palace, room, and node as a JSON snapshot."
      >
        <ExportButton />
      </SettingsSection>

      <SettingsSection
        title="Import"
        description="Bring in a previously exported snapshot or compatible markdown deck."
      >
        <ImportDialog />
      </SettingsSection>

      <SettingsSection title="Danger zone" description="Irreversible actions live here.">
        <Alert variant="destructive">
          <AlertTitle>Account deletion is not yet wired up</AlertTitle>
          <AlertDescription>
            Reach out to support to remove your account and data. A self-serve delete flow is on the
            roadmap.
          </AlertDescription>
        </Alert>
      </SettingsSection>
    </div>
  );
}
