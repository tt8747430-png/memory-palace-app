'use client';

import { useCallback } from 'react';

async function fireConfetti() {
  const confetti = (await import('canvas-confetti')).default;
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
  });
}

export function useConfetti() {
  return useCallback(() => {
    fireConfetti();
  }, []);
}
