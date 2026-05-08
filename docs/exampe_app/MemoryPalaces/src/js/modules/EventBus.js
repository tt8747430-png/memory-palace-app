/**
 * EventBus — Lightweight publish/subscribe event system.
 *
 * Decouples data producers (PalaceManager, PracticeManager) from consumers
 * (UIController, SyncManager) following the Observer pattern (Guide §2.3).
 *
 * Instead of modules calling each other directly, they emit named events
 * and interested parties subscribe. This enables:
 *  - Adding new consumers without modifying producers
 *  - Testing producers and consumers independently
 *  - Clear, traceable data flow direction
 *
 * Usage:
 *   eventBus.on('palaces:changed', () => ui.renderPalaces());
 *   eventBus.emit('palaces:changed', { reason: 'create' });
 */

class _EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} event — event name (e.g. 'palaces:changed')
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);

    // Return unsubscribe function for clean teardown
    return () => this._listeners.get(event)?.delete(callback);
  }

  /**
   * Subscribe to an event, but only fire once.
   * @param {string} event
   * @param {Function} callback
   */
  once(event, callback) {
    const unsub = this.on(event, (...args) => {
      unsub();
      callback(...args);
    });
    return unsub;
  }

  /**
   * Emit an event to all subscribers.
   * @param {string} event
   * @param {*} [data] — optional payload
   */
  emit(event, data) {
    const listeners = this._listeners.get(event);
    if (!listeners) return;
    for (const cb of listeners) {
      try {
        cb(data);
      } catch (err) {
        console.error(`[EventBus] Error in listener for "${event}":`, err);
      }
    }
  }

  /**
   * Remove all listeners for an event, or all events if no name given.
   * @param {string} [event]
   */
  off(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
  }
}

/** Singleton event bus used across the application. */
export const eventBus = new _EventBus();
