import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell, type AuthStep } from '@/features/auth';
import { OnboardingWizard } from '@/features/onboarding';

export const metadata: Metadata = {
  title: 'Get Started — Memory Palace',
  description: 'Create your account and build your first memory palace in under 5 minutes.',
  robots: { index: true, follow: true },
};

type SignupPageProps = {
  searchParams: Promise<{ step?: string }>;
};

function buildSteps(currentStep: number): AuthStep[] {
  return [
    { number: 1, text: 'Create your account', active: currentStep <= 1 },
    { number: 2, text: 'Build your first palace', active: currentStep >= 2 && currentStep <= 3 },
    { number: 3, text: 'Place your first memory', active: currentStep >= 4 },
  ];
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { step } = await searchParams;
  const parsed = parseInt(step ?? '1', 10);
  const currentStep = Number.isFinite(parsed) ? Math.max(1, Math.min(5, parsed)) : 1;

  return (
    <AuthShell
      brandTitle="Join the palace."
      brandSubtitle="Three short phases — and your first walk-through is live."
      steps={buildSteps(currentStep)}
      kicker="Get started"
      title="Begin your palace."
      subtitle="Three short steps. Five minutes. Then you walk through your own world."
    >
      <Suspense>
        <OnboardingWizard />
      </Suspense>
    </AuthShell>
  );
}
