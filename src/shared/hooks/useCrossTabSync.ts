'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onCrossTabInvalidate } from '@/shared/lib/cross-tab-sync';

export function useCrossTabSync(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    return onCrossTabInvalidate((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
  }, [queryClient]);
}
