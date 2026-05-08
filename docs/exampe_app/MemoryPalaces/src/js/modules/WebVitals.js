/**
 * WebVitals — Lightweight Core Web Vitals collection using native PerformanceObserver.
 *
 * Measures LCP, INP, and CLS (the three 2026 Core Web Vitals) and logs results
 * via the app's Logger for diagnostics. No external CDN dependency — uses the
 * same browser APIs that the web-vitals library wraps.
 */

import { Logger } from './Logger.js';

/**
 * Report a CWV metric.
 * @param {string} name
 * @param {number} value
 */
function report(name, value) {
  const display = Math.round(name === 'CLS' ? value * 1000 : value);
  const unit = name === 'CLS' ? '(×1000)' : 'ms';
  const threshold = name === 'LCP' ? 2500 : name === 'INP' ? 200 : 0.1;
  const rating =
    value <= threshold ? 'good' : value <= threshold * 1.6 ? 'needs-improvement' : 'poor';

  Logger.info(`[CWV] ${name} = ${display}${unit}  [${rating}]`, { name, value, rating });
}

/** Safely create a PerformanceObserver — no-ops if the entry type is unsupported. */
function observe(type, callback) {
  try {
    const supported = PerformanceObserver.supportedEntryTypes;
    if (supported && !supported.includes(type)) return;
    new PerformanceObserver(callback).observe({ type, buffered: true });
  } catch {
    // Entry type not supported in this browser — skip silently
  }
}

/**
 * Initialise CWV collection. Safe to call in any environment.
 * Uses native PerformanceObserver — zero external dependencies.
 */
export function initWebVitals() {
  if (typeof PerformanceObserver === 'undefined') return;

  // LCP — Largest Contentful Paint
  observe('largest-contentful-paint', (list) => {
    const entries = list.getEntries();
    if (entries.length) report('LCP', entries[entries.length - 1].startTime);
  });

  // CLS — Cumulative Layout Shift (report once on visibilitychange / pagehide)
  let clsValue = 0;
  let clsReported = false;
  observe('layout-shift', (list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) clsValue += entry.value;
    }
  });
  const reportCLS = () => {
    if (!clsReported) {
      clsReported = true;
      report('CLS', clsValue);
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') reportCLS();
  });
  window.addEventListener('pagehide', reportCLS);

  // INP — Interaction to Next Paint (report once on visibilitychange / pagehide)
  let inpValue = 0;
  let inpReported = false;
  observe('event', (list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > inpValue) inpValue = entry.duration;
    }
  });
  const reportINP = () => {
    if (!inpReported && inpValue > 0) {
      inpReported = true;
      report('INP', inpValue);
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') reportINP();
  });
  window.addEventListener('pagehide', reportINP);
}
