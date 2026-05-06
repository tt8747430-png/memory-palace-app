import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';

describe('useOnlineStatus', () => {
  it('returns the current online status', () => {
    const { result } = renderHook(() => useOnlineStatus());
    // In test environment, navigator.onLine defaults to true
    expect(result.current).toBe(true);
  });

  it('returns a boolean', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(typeof result.current).toBe('boolean');
  });
});
