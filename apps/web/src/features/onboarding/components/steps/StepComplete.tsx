'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@memory-palace/ui';
import { useConfetti } from '@/shared/hooks/useConfetti';

export function StepComplete() {
  const router = useRouter();
  const fire = useConfetti();
  const fired = useRef(false);

  // Guard prevents double-fire in React Strict Mode (dev) and on re-mounts.
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fire();
  }, [fire]);

  return (
    <div className="space-y-6 text-center">
      <div className="text-6xl">🎉</div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Your palace is ready!</h2>
        <p className="text-muted-foreground">
          You&rsquo;ve created your first memory palace and added your first node. Your memory
          journey starts now.
        </p>
      </div>
      <Button
        type="button"
        size="lg"
        className="w-full sm:w-auto"
        onClick={() => router.push('/dashboard')}
      >
        Enter my palace
      </Button>
    </div>
  );
}
