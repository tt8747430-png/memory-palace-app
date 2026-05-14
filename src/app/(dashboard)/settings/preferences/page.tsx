import { ReducedMotionStatus, SettingsSection, ThemePicker } from '@/features/settings';

export const metadata = { title: 'Preferences · Settings' };

export default function SettingsPreferencesPage() {
  return (
    <div className="space-y-6">
      <SettingsSection
        title="Theme"
        description="Pick how Memory Palace appears. System follows your device."
      >
        <ThemePicker />
      </SettingsSection>
      <SettingsSection
        title="Motion"
        description="Animations respect your system accessibility preference."
      >
        <ReducedMotionStatus />
      </SettingsSection>
    </div>
  );
}
