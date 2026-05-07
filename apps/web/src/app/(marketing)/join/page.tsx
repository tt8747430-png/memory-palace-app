import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OnboardingWizard } from '@/features/onboarding';

export const metadata: Metadata = {
  title: 'Get Started — Memory Palace',
  description: 'Create your account and build your first memory palace in under 5 minutes.',
  robots: { index: true, follow: true },
};

export default function JoinPage() {
  return (
    // Suspense is required because OnboardingWizard uses useSearchParams()
    <Suspense>
      <OnboardingWizard />
    </Suspense>
  );
}
