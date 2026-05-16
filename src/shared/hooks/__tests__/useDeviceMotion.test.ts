import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  getInitialMotionPermission,
  requestMotionPermission,
  useDeviceMotion,
  useMotionPermission,
} from '@/shared/hooks/useDeviceMotion';

const originalMotion = (globalThis as Record<string, unknown>).DeviceMotionEvent;
const originalOrientation = (globalThis as Record<string, unknown>).DeviceOrientationEvent;

function setMotionCtor(ctor: unknown) {
  (globalThis as Record<string, unknown>).DeviceMotionEvent = ctor;
  (window as unknown as Record<string, unknown>).DeviceMotionEvent = ctor;
}

function setOrientationCtor(ctor: unknown) {
  (globalThis as Record<string, unknown>).DeviceOrientationEvent = ctor;
  (window as unknown as Record<string, unknown>).DeviceOrientationEvent = ctor;
}

afterEach(() => {
  setMotionCtor(originalMotion);
  setOrientationCtor(originalOrientation);
});

describe('requestMotionPermission', () => {
  beforeEach(() => {
    setMotionCtor(function DeviceMotionEvent() {});
    setOrientationCtor(function DeviceOrientationEvent() {});
  });

  it('resolves to "granted" on platforms without iOS gating', async () => {
    await expect(requestMotionPermission()).resolves.toBe('granted');
  });

  it('returns "granted" when iOS requestPermission resolves to granted for both', async () => {
    const motion = vi.fn().mockResolvedValue('granted');
    const orientation = vi.fn().mockResolvedValue('granted');
    setMotionCtor(Object.assign(function () {}, { requestPermission: motion }));
    setOrientationCtor(Object.assign(function () {}, { requestPermission: orientation }));

    await expect(requestMotionPermission()).resolves.toBe('granted');
    expect(motion).toHaveBeenCalledTimes(1);
    expect(orientation).toHaveBeenCalledTimes(1);
  });

  it('returns "denied" if any iOS request is denied', async () => {
    setMotionCtor(
      Object.assign(function () {}, { requestPermission: vi.fn().mockResolvedValue('granted') }),
    );
    setOrientationCtor(
      Object.assign(function () {}, { requestPermission: vi.fn().mockResolvedValue('denied') }),
    );
    await expect(requestMotionPermission()).resolves.toBe('denied');
  });

  it('returns "denied" if the request throws (no user gesture)', async () => {
    setMotionCtor(
      Object.assign(function () {}, {
        requestPermission: vi.fn().mockRejectedValue(new Error('no gesture')),
      }),
    );
    await expect(requestMotionPermission()).resolves.toBe('denied');
  });
});

describe('getInitialMotionPermission', () => {
  it('returns "prompt" when iOS gating is present', () => {
    setMotionCtor(Object.assign(function () {}, { requestPermission: vi.fn() }));
    expect(getInitialMotionPermission()).toBe('prompt');
  });

  it('returns "granted" when the API exists without gating', () => {
    setMotionCtor(function () {});
    setOrientationCtor(function () {});
    expect(getInitialMotionPermission()).toBe('granted');
  });
});

describe('useDeviceMotion', () => {
  beforeEach(() => {
    setMotionCtor(function () {});
  });

  it('does not subscribe when disabled', () => {
    const add = vi.spyOn(window, 'addEventListener');
    renderHook(() => useDeviceMotion(false));
    expect(add).not.toHaveBeenCalledWith('devicemotion', expect.any(Function));
    add.mockRestore();
  });

  it('updates state on devicemotion events when enabled', () => {
    const { result } = renderHook(() => useDeviceMotion(true));
    act(() => {
      const event = new Event('devicemotion') as DeviceMotionEvent;
      Object.assign(event, {
        acceleration: { x: 1, y: 2, z: 3 },
        accelerationIncludingGravity: { x: 4, y: 5, z: 6 },
        rotationRate: { alpha: 7, beta: 8, gamma: 9 },
        interval: 16,
      });
      window.dispatchEvent(event);
    });
    expect(result.current.acceleration).toEqual({ x: 1, y: 2, z: 3 });
    expect(result.current.rotationRate.beta).toBe(8);
    expect(result.current.interval).toBe(16);
  });
});

describe('useMotionPermission', () => {
  it('exposes a request action that updates the permission state', async () => {
    setMotionCtor(
      Object.assign(function () {}, { requestPermission: vi.fn().mockResolvedValue('granted') }),
    );
    setOrientationCtor(function () {});

    const { result } = renderHook(() => useMotionPermission());
    expect(result.current.permission).toBe('prompt');

    let resolved: string | undefined;
    await act(async () => {
      resolved = await result.current.request();
    });
    expect(resolved).toBe('granted');
    expect(result.current.permission).toBe('granted');
  });
});
