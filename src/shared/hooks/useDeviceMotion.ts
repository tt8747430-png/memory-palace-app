'use client';

import { useCallback, useEffect, useState } from 'react';

export type SensorPermissionState = 'unsupported' | 'prompt' | 'granted' | 'denied';

export interface DeviceMotionState {
  acceleration: { x: number | null; y: number | null; z: number | null };
  accelerationIncludingGravity: { x: number | null; y: number | null; z: number | null };
  rotationRate: { alpha: number | null; beta: number | null; gamma: number | null };
  interval: number;
}

export interface DeviceOrientationState {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean;
}

interface IOSPermissionRequester {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

const EMPTY_MOTION: DeviceMotionState = {
  acceleration: { x: null, y: null, z: null },
  accelerationIncludingGravity: { x: null, y: null, z: null },
  rotationRate: { alpha: null, beta: null, gamma: null },
  interval: 0,
};

const EMPTY_ORIENTATION: DeviceOrientationState = {
  alpha: null,
  beta: null,
  gamma: null,
  absolute: false,
};

function isMotionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

function isOrientationSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

function needsIOSPermission(ctor: unknown): ctor is IOSPermissionRequester {
  return (
    typeof ctor === 'function' &&
    typeof (ctor as IOSPermissionRequester).requestPermission === 'function'
  );
}

/**
 * Requests permission for DeviceMotion + DeviceOrientation events.
 *
 * MUST be invoked from a user-gesture handler (click/touchend) on iOS 13+;
 * otherwise the promise rejects. On platforms that don't gate these events
 * (Android, desktop) it resolves to `'granted'` immediately.
 */
export async function requestMotionPermission(): Promise<SensorPermissionState> {
  if (!isMotionSupported() && !isOrientationSupported()) return 'unsupported';

  const motionCtor = (window as unknown as { DeviceMotionEvent?: unknown }).DeviceMotionEvent;
  const orientationCtor = (window as unknown as { DeviceOrientationEvent?: unknown })
    .DeviceOrientationEvent;

  const requests: Array<Promise<'granted' | 'denied'>> = [];
  if (needsIOSPermission(motionCtor)) requests.push(motionCtor.requestPermission!());
  if (needsIOSPermission(orientationCtor)) requests.push(orientationCtor.requestPermission!());

  if (requests.length === 0) return 'granted';

  try {
    const results = await Promise.all(requests);
    return results.every((r) => r === 'granted') ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/**
 * Best-effort initial permission state. iOS doesn't expose a query API for
 * motion sensors, so we report `'prompt'` when the gated `requestPermission`
 * method exists and `'granted'` otherwise.
 */
export function getInitialMotionPermission(): SensorPermissionState {
  if (!isMotionSupported() && !isOrientationSupported()) return 'unsupported';
  const motionCtor = (window as unknown as { DeviceMotionEvent?: unknown }).DeviceMotionEvent;
  const orientationCtor = (window as unknown as { DeviceOrientationEvent?: unknown })
    .DeviceOrientationEvent;
  if (needsIOSPermission(motionCtor) || needsIOSPermission(orientationCtor)) return 'prompt';
  return 'granted';
}

/**
 * Subscribes to `devicemotion` while `enabled` is true. The caller is responsible
 * for ensuring permission has been granted (via `requestMotionPermission`) on iOS.
 */
export function useDeviceMotion(enabled: boolean): DeviceMotionState {
  const [state, setState] = useState<DeviceMotionState>(EMPTY_MOTION);

  useEffect(() => {
    if (!enabled || !isMotionSupported()) return;

    const handler = (event: DeviceMotionEvent) => {
      setState({
        acceleration: {
          x: event.acceleration?.x ?? null,
          y: event.acceleration?.y ?? null,
          z: event.acceleration?.z ?? null,
        },
        accelerationIncludingGravity: {
          x: event.accelerationIncludingGravity?.x ?? null,
          y: event.accelerationIncludingGravity?.y ?? null,
          z: event.accelerationIncludingGravity?.z ?? null,
        },
        rotationRate: {
          alpha: event.rotationRate?.alpha ?? null,
          beta: event.rotationRate?.beta ?? null,
          gamma: event.rotationRate?.gamma ?? null,
        },
        interval: event.interval,
      });
    };

    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, [enabled]);

  return state;
}

/**
 * Subscribes to `deviceorientation` while `enabled` is true. Same permission
 * requirements as `useDeviceMotion` on iOS.
 */
export function useDeviceOrientation(enabled: boolean): DeviceOrientationState {
  const [state, setState] = useState<DeviceOrientationState>(EMPTY_ORIENTATION);

  useEffect(() => {
    if (!enabled || !isOrientationSupported()) return;

    const handler = (event: DeviceOrientationEvent) => {
      setState({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        absolute: event.absolute,
      });
    };

    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, [enabled]);

  return state;
}

/**
 * Convenience hook that tracks permission state and exposes a `request` action
 * that must be wired to a user-gesture handler.
 */
export function useMotionPermission(): {
  permission: SensorPermissionState;
  request: () => Promise<SensorPermissionState>;
} {
  const [permission, setPermission] = useState<SensorPermissionState>(() =>
    typeof window === 'undefined' ? 'prompt' : getInitialMotionPermission(),
  );

  const request = useCallback(async () => {
    const result = await requestMotionPermission();
    setPermission(result);
    return result;
  }, []);

  return { permission, request };
}
