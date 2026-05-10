import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OnboardingWizard } from '@/features/onboarding';
import { CinematicBackground, CinematicNav, CinematicFooter } from '@/features/marketing';

export const metadata: Metadata = {
  title: 'Get Started — Memory Palace',
  description: 'Create your account and build your first memory palace in under 5 minutes.',
  robots: { index: true, follow: true },
};

export default function JoinPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-cinematic text-white">
      <CinematicBackground />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <CinematicNav />

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 pt-32 pb-16 md:px-6 md:pt-40">
          <div className="mb-10 text-center">
            <p className="mb-4 font-body text-sm text-white/70">{'// Begin your voyage'}</p>
            <h1 className="font-heading text-5xl italic leading-[0.9] tracking-[-2px] text-white md:text-6xl">
              Build your first
              <br />
              palace.
            </h1>
            <p className="mx-auto mt-6 max-w-md font-body text-sm font-light leading-snug text-white/85 md:text-base">
              Three short steps. Five minutes. Then you walk through your own world.
            </p>
          </div>

          {/* Wizard renders inside a frosted glass panel that matches the
              cinematic auth shell. */}
          <div className="liquid-glass w-full rounded-3xl text-foreground shadow-2xl">
            <div className="px-6 py-8 md:px-10 md:py-10">
              {/* Suspense is required because OnboardingWizard uses useSearchParams() */}
              <Suspense>
                <OnboardingWizard />
              </Suspense>
            </div>
          </div>
        </main>

        <CinematicFooter />
      </div>
    </div>
  );
}
