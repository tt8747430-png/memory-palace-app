import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Each test gets a fresh module import via vi.resetModules + dynamic import.
// This prevents the module-level `channel` singleton from leaking between tests.

describe('cross-tab-sync', () => {
  let mockInstance: {
    postMessage: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetModules();

    mockInstance = {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn(),
    };

    // Use a proper class constructor mock
    class MockBroadcastChannel {
      postMessage = mockInstance.postMessage;
      addEventListener = mockInstance.addEventListener;
      removeEventListener = mockInstance.removeEventListener;
      close = mockInstance.close;
    }

    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('broadcastInvalidate sends the correct message structure', async () => {
    const { broadcastInvalidate } = await import('@/shared/lib/cross-tab-sync');

    const queryKey = ['rooms', '123', 'nodes'] as const;
    broadcastInvalidate(queryKey);

    expect(mockInstance.postMessage).toHaveBeenCalledOnce();
    expect(mockInstance.postMessage).toHaveBeenCalledWith({
      type: 'invalidate',
      queryKey: ['rooms', '123', 'nodes'],
    });
  });

  it('onCrossTabInvalidate calls the callback with the queryKey', async () => {
    const { onCrossTabInvalidate } = await import('@/shared/lib/cross-tab-sync');

    const callback = vi.fn();
    onCrossTabInvalidate(callback);

    expect(mockInstance.addEventListener).toHaveBeenCalledOnce();
    const [, handler] = mockInstance.addEventListener.mock.calls[0];

    // Simulate a message event
    handler({
      data: { type: 'invalidate', queryKey: ['rooms', 'abc', 'nodes'] },
    });

    expect(callback).toHaveBeenCalledWith(['rooms', 'abc', 'nodes']);
  });

  it('onCrossTabInvalidate ignores messages with wrong type', async () => {
    const { onCrossTabInvalidate } = await import('@/shared/lib/cross-tab-sync');

    const callback = vi.fn();
    onCrossTabInvalidate(callback);

    const [, handler] = mockInstance.addEventListener.mock.calls[0];

    handler({ data: { type: 'other', queryKey: ['test'] } });
    expect(callback).not.toHaveBeenCalled();
  });

  it('onCrossTabInvalidate returns an unsubscribe function', async () => {
    const { onCrossTabInvalidate } = await import('@/shared/lib/cross-tab-sync');

    const unsubscribe = onCrossTabInvalidate(vi.fn());
    unsubscribe();

    expect(mockInstance.removeEventListener).toHaveBeenCalledOnce();
  });
});

describe('cross-tab-sync without BroadcastChannel', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('BroadcastChannel', undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('broadcastInvalidate is a no-op when BroadcastChannel is unavailable', async () => {
    const { broadcastInvalidate } = await import('@/shared/lib/cross-tab-sync');

    // Should not throw
    expect(() => broadcastInvalidate(['test'])).not.toThrow();
  });

  it('onCrossTabInvalidate returns a no-op unsubscribe', async () => {
    const { onCrossTabInvalidate } = await import('@/shared/lib/cross-tab-sync');

    const unsubscribe = onCrossTabInvalidate(vi.fn());
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });
});
