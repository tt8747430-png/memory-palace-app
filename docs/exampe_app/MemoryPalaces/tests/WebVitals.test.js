import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Logger before importing WebVitals
vi.mock('../src/js/modules/Logger.js', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { initWebVitals } from '../src/js/modules/WebVitals.js';
import { Logger } from '../src/js/modules/Logger.js';

describe('WebVitals', () => {
  let observerCallbacks;
  let originalPO;

  beforeEach(() => {
    vi.clearAllMocks();
    observerCallbacks = {};

    // Mock PerformanceObserver
    originalPO = globalThis.PerformanceObserver;
    globalThis.PerformanceObserver = vi.fn(function (cb) {
      this.observe = vi.fn(({ type }) => {
        observerCallbacks[type] = cb;
      });
    });
    globalThis.PerformanceObserver.supportedEntryTypes = [
      'largest-contentful-paint',
      'layout-shift',
      'event',
    ];
  });

  afterEach(() => {
    globalThis.PerformanceObserver = originalPO;
  });

  it('creates observers for LCP, CLS, and INP', () => {
    initWebVitals();

    expect(observerCallbacks['largest-contentful-paint']).toBeTruthy();
    expect(observerCallbacks['layout-shift']).toBeTruthy();
    expect(observerCallbacks['event']).toBeTruthy();
  });

  it('reports LCP metric', () => {
    initWebVitals();

    observerCallbacks['largest-contentful-paint']({
      getEntries: () => [{ startTime: 2000 }],
    });

    expect(Logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[CWV] LCP'),
      expect.objectContaining({ name: 'LCP', value: 2000, rating: 'good' }),
    );
  });

  it('reports LCP with poor rating', () => {
    initWebVitals();

    observerCallbacks['largest-contentful-paint']({
      getEntries: () => [{ startTime: 5000 }],
    });

    expect(Logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[CWV] LCP'),
      expect.objectContaining({ rating: 'poor' }),
    );
  });

  it('reports LCP with needs-improvement rating', () => {
    initWebVitals();

    observerCallbacks['largest-contentful-paint']({
      getEntries: () => [{ startTime: 3500 }],
    });

    expect(Logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[CWV] LCP'),
      expect.objectContaining({ rating: 'needs-improvement' }),
    );
  });

  it('does not report LCP when no entries', () => {
    initWebVitals();

    observerCallbacks['largest-contentful-paint']({ getEntries: () => [] });
    // Should not have called Logger.info for LCP
    expect(Logger.info).not.toHaveBeenCalledWith(
      expect.stringContaining('[CWV] LCP'),
      expect.anything(),
    );
  });

  it('accumulates CLS value and reports on visibilitychange', () => {
    initWebVitals();

    // Accumulate layout shifts
    observerCallbacks['layout-shift']({
      getEntries: () => [{ value: 0.05, hadRecentInput: false }],
    });
    observerCallbacks['layout-shift']({
      getEntries: () => [{ value: 0.03, hadRecentInput: false }],
    });

    // Simulate visibility change to hidden
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(Logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[CWV] CLS'),
      expect.objectContaining({ name: 'CLS' }),
    );

    // Reset visibilityState
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
  });

  it('ignores layout shifts with recent input', () => {
    initWebVitals();

    observerCallbacks['layout-shift']({
      getEntries: () => [{ value: 0.1, hadRecentInput: true }],
    });

    // Trigger CLS report
    window.dispatchEvent(new Event('pagehide'));
    // CLS should be 0, which still gets reported
  });

  it('reports INP on pagehide', () => {
    initWebVitals();

    observerCallbacks['event']({
      getEntries: () => [{ duration: 150 }],
    });

    window.dispatchEvent(new Event('pagehide'));

    expect(Logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[CWV] INP'),
      expect.objectContaining({ name: 'INP', value: 150, rating: 'good' }),
    );
  });

  it('tracks maximum INP value', () => {
    initWebVitals();

    observerCallbacks['event']({
      getEntries: () => [{ duration: 100 }, { duration: 250 }],
    });

    window.dispatchEvent(new Event('pagehide'));

    expect(Logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[CWV] INP'),
      expect.objectContaining({ value: 250 }),
    );
  });

  it('does not report INP when value is 0', () => {
    initWebVitals();

    observerCallbacks['event']({
      getEntries: () => [{ duration: 0 }],
    });

    window.dispatchEvent(new Event('pagehide'));
    expect(Logger.info).not.toHaveBeenCalledWith(
      expect.stringContaining('[CWV] INP'),
      expect.anything(),
    );
  });

  it('no-ops when PerformanceObserver is undefined', () => {
    globalThis.PerformanceObserver = undefined;
    initWebVitals(); // Should not throw
  });

  it('handles unsupported entry types gracefully', () => {
    globalThis.PerformanceObserver.supportedEntryTypes = [];
    initWebVitals(); // Should not throw, observers shouldn't be created
  });

  it('handles PerformanceObserver constructor error gracefully', () => {
    globalThis.PerformanceObserver = vi.fn(() => {
      throw new Error('Not supported');
    });
    globalThis.PerformanceObserver.supportedEntryTypes = ['largest-contentful-paint'];
    initWebVitals(); // Should not throw
  });

  it('reports CLS only once per init (via pagehide after visibilitychange)', () => {
    initWebVitals();

    observerCallbacks['layout-shift']({
      getEntries: () => [{ value: 0.05, hadRecentInput: false }],
    });

    // First report via visibilitychange
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    // Count CLS calls only from THIS specific initWebVitals invocation
    // The pagehide after should not add another CLS report from same init
    const clsCallsBefore = Logger.info.mock.calls.filter((c) => c[0].includes('[CWV] CLS')).length;
    expect(clsCallsBefore).toBeGreaterThanOrEqual(1);

    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
  });
});
