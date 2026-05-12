'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@memory-palace/ui';
import { useConfetti } from '@/shared/hooks/useConfetti';
import { onboardingMutedTextClass, onboardingSubmitButtonClass } from '../onboardingStyles';

export function StepComplete() {
  const router = useRouter();
  const fire = useConfetti();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fire();
  }, [fire]);

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-3">
        <h2 className="font-heading text-4xl font-normal leading-[1.05] tracking-[-1.5px] text-white md:text-5xl">
          Your palace is <em className="not-italic text-white/60">ready.</em>
        </h2>
        <p className={`mx-auto max-w-md text-base ${onboardingMutedTextClass}`}>
          You&rsquo;ve created your first memory palace and added your first node. Your memory
          journey starts now.
        </p>
      </div>
      <Button
        type="button"
        onClick={() => router.push('/dashboard')}
        className={onboardingSubmitButtonClass}
      >
        Enter my palace
      </Button>
    </div>
  );
}
