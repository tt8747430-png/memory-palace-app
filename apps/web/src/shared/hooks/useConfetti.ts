'use client';

import { useCallback } from 'react';

export function useConfetti() {
  const fire = useCallback(async () => {
    const { default: confetti } = await import('canvas-confetti');
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }, []);

  return { fire };
}
