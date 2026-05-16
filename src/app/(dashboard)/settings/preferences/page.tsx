import type { Metadata } from 'next';
import { ReducedMotionStatus, SettingsSection, ThemePicker } from '@/features/settings';
import { PracticeSwipePicker } from '@/features/practice';

export const metadata: Metadata = { title: 'Preferences · Settings' };

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
        title="Flashcard swipes"
        description="Customize what happens when you swipe a flashcard left or right."
      >
        <PracticeSwipePicker />
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
