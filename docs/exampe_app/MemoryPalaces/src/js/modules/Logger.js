/**
 * Logger — Structured logging utility with ring-buffer for recent errors.
 *
 * Provides consistent, timestamped, context-rich logging across the app.
 * Captures recent errors in a fixed-size ring buffer for diagnostics
 * (viewable in the Statistics modal or via `Logger.getRecentErrors()`).
 */

/** @typedef {'debug'|'info'|'warn'|'error'} LogLevel */

const LEVEL_PRIORITY = { debug: 0, info: 1, warn: 2, error: 3 };
const MAX_RING_SIZE = 50;

// noinspection JSUnusedGlobalSymbols — public API methods used externally
class _Logger {
  constructor() {
    /** @type {LogLevel} */
    this.minLevel = 'info';
    /** @type {Array<{ts: string, level: LogLevel, message: string, context?: Record<string, unknown>}>} */
    this._ring = [];
  }

  /**
   * Set the minimum log level (messages below this are silently dropped).
   * @param {LogLevel} level
   */
  setLevel(level) {
    this.minLevel = level;
  }

  /**
   * Core logging method.
   * @param {LogLevel} level
   * @param {string} message
   * @param {Record<string, unknown>} [context]
   */
  log(level, message, context) {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.minLevel]) return;

    const entry = {
      ts: new Date().toISOString(),
      level,
      message,
      ...(context ? { context } : {}),
    };

    // Store in ring buffer (all levels ≥ warn)
    if (LEVEL_PRIORITY[level] >= LEVEL_PRIORITY.warn) {
      this._ring.push(entry);
      if (this._ring.length > MAX_RING_SIZE) this._ring.shift();
    }

    // Delegate to console
    const consoleFn =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : level === 'debug'
            ? console.debug
            : console.log;

    if (context) {
      consoleFn(`[${entry.ts}] [${level.toUpperCase()}] ${message}`, context);
    } else {
      consoleFn(`[${entry.ts}] [${level.toUpperCase()}] ${message}`);
    }
  }

  debug(message, context) {
    this.log('debug', message, context);
  }
  info(message, context) {
    this.log('info', message, context);
  }
  warn(message, context) {
    this.log('warn', message, context);
  }
  error(message, context) {
    this.log('error', message, context);
  }

  /**
   * Return the most recent warnings/errors captured in the ring buffer.
   * @param {number} [count] — max entries to return (default: all)
   * @returns {Array<{ts: string, level: LogLevel, message: string, context?: Record<string, unknown>}>}
   */
  getRecentErrors(count) {
    return count ? this._ring.slice(-count) : [...this._ring];
  }

  /** Clear the ring buffer. */
  clearRing() {
    this._ring.length = 0;
  }

  /**
   * Export ring buffer as structured NDJSON string (§8.1 — logs as event streams).
   * Each line is a self-contained JSON object, compatible with log aggregation tools.
   * @returns {string} Newline-delimited JSON
   */
  exportAsNDJSON() {
    return this._ring.map((entry) => JSON.stringify(entry)).join('\n');
  }

  /**
   * Download the ring buffer as a structured log file.
   * Useful for offline diagnostics and bug reports.
   */
  downloadLogs() {
    const ndjson = this.exportAsNDJSON();
    if (!ndjson) return;
    const blob = new Blob([ndjson], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-palace-logs-${new Date().toISOString().split('T')[0]}.ndjson`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/** Singleton logger instance used across the application. */
export const Logger = new _Logger();
