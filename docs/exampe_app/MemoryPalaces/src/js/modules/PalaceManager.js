import { Logger } from './Logger.js';
import { eventBus } from './EventBus.js';
import { validatePalace } from './validation.js';

/** Generate a collision-resistant unique ID. */
function generateId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for older browsers
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

/**
 * PalaceManager - Handles all data operations for memory palaces
 */
export class PalaceManager {
  constructor(syncManager = null, notificationManager = null) {
    this.baseStorageKey = 'memoryPalaces';
    this.storageKey = '';
    this.syncManager = syncManager;
    this.notificationManager = notificationManager;
    this.palaces = [];
    this.setStorageScope('guest');
  }

  /** Switch between guest and user-scoped storage keys. */
  setStorageScope(scope = 'guest') {
    const nextKey = `${this.baseStorageKey}:${scope}`;
    if (this.storageKey === nextKey) return;

    this.storageKey = nextKey;
    this._migrateLegacyStorage();
    this.palaces = this.loadFromStorage();
  }

  _migrateLegacyStorage() {
    try {
      const hasScoped = localStorage.getItem(this.storageKey) !== null;
      const legacy = localStorage.getItem(this.baseStorageKey);
      if (!hasScoped && legacy) {
        localStorage.setItem(this.storageKey, legacy);
      }
      // Clean up legacy key after migration to free storage space
      if (legacy) {
        localStorage.removeItem(this.baseStorageKey);
      }
    } catch (error) {
      Logger.error('Error migrating palace storage key', { error: String(error) });
    }
  }

  /**
   * Load palaces from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      Logger.error('Error loading palaces', { error: String(error) });
      return [];
    }
  }

  /**
   * Save palaces to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.palaces));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        Logger.error('Storage quota exceeded! Export data and remove old palaces.', {
          error: String(error),
        });
        this.notificationManager?.error(
          '⚠️ Storage full! Export your palaces and delete old ones to free space.',
        );
      } else {
        Logger.error('Error saving palaces', { error: String(error) });
      }
    }
  }

  /**
   * Get all palaces — returns a shallow copy to prevent external mutation of internal state.
   */
  getAllPalaces() {
    return [...this.palaces];
  }

  /**
   * Get palace by ID
   */
  getPalaceById(id) {
    return this.palaces.find((p) => p.id === id);
  }

  /**
   * Create new palace
   */
  createPalace(palaceData) {
    const newPalace = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...palaceData,
    };

    this.palaces.push(newPalace);
    this.saveToStorage();
    this.syncManager?.uploadPalace(newPalace);
    eventBus.emit('palaces:changed', { reason: 'create', id: newPalace.id });
    return newPalace;
  }

  /**
   * Duplicate an existing palace with a new ID and copy-suffixed name.
   */
  duplicatePalace(id) {
    const original = this.getPalaceById(id);
    if (!original) return null;

    const now = new Date().toISOString();
    const cloned = JSON.parse(JSON.stringify(original));
    const duplicate = {
      ...cloned,
      id: generateId(),
      name: this._getUniqueCopyName(original.name || 'Untitled Palace'),
      createdAt: now,
      updatedAt: now,
    };

    this.palaces.push(duplicate);
    this.saveToStorage();
    this.syncManager?.uploadPalace(duplicate);
    eventBus.emit('palaces:changed', { reason: 'duplicate', id: duplicate.id });
    return duplicate;
  }

  /**
   * Update existing palace
   */
  updatePalace(id, palaceData) {
    const index = this.palaces.findIndex((p) => p.id === id);
    if (index === -1) return null;

    this.palaces[index] = {
      ...this.palaces[index],
      ...palaceData,
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage();
    this.syncManager?.uploadPalace(this.palaces[index]);
    eventBus.emit('palaces:changed', { reason: 'update', id });
    return this.palaces[index];
  }

  /**
   * Delete palace
   */
  deletePalace(id, options = {}) {
    const { skipSync = false } = options;
    const palace = this.getPalaceById(id);
    if (!palace) return null;

    const affectedPalaceIds = this.palaces
      .filter((p) => p.id !== id && p.connections?.includes(id))
      .map((p) => p.id);

    // Remove palace
    this.palaces = this.palaces.filter((p) => p.id !== id);

    // Remove connections to this palace from other palaces
    this.palaces.forEach((p) => {
      if (p.connections) {
        p.connections = p.connections.filter((cId) => cId !== id);
      }
    });

    this.saveToStorage();
    if (!skipSync) {
      this.syncManager?.removeCloudPalace(id);
    }

    eventBus.emit('palaces:changed', { reason: 'delete', id });

    return {
      palace: JSON.parse(JSON.stringify(palace)),
      affectedPalaceIds,
    };
  }

  /**
   * Restore a previously deleted palace and its incoming connections.
   */
  restoreDeletedPalace(deletedRecord) {
    if (!deletedRecord?.palace || this.getPalaceById(deletedRecord.palace.id)) return null;

    this.palaces.push(deletedRecord.palace);

    (deletedRecord.affectedPalaceIds || []).forEach((palaceId) => {
      const connectedPalace = this.getPalaceById(palaceId);
      if (!connectedPalace) return;

      connectedPalace.connections = connectedPalace.connections || [];
      if (!connectedPalace.connections.includes(deletedRecord.palace.id)) {
        connectedPalace.connections.push(deletedRecord.palace.id);
      }
    });

    this.saveToStorage();
    this.syncManager?.uploadPalace(deletedRecord.palace);
    (deletedRecord.affectedPalaceIds || []).forEach((palaceId) => {
      const connectedPalace = this.getPalaceById(palaceId);
      if (connectedPalace) {
        this.syncManager?.uploadPalace(connectedPalace);
      }
    });

    eventBus.emit('palaces:changed', { reason: 'restore', id: deletedRecord.palace.id });
    return deletedRecord.palace;
  }

  /**
   * Replace the entire local palace list (used after cloud merge).
   * Validates and sanitizes each palace to guard against malicious cloud data.
   */
  replaceAll(palaces) {
    if (!Array.isArray(palaces)) {
      Logger.error('replaceAll: expected array', { got: typeof palaces });
      return;
    }
    this.palaces = palaces.map((p) => validatePalace(p).sanitized);
    this.saveToStorage();
    eventBus.emit('palaces:changed', { reason: 'replaceAll' });
  }

  /**
   * Search/filter palaces
   */
  searchPalaces(searchTerm) {
    if (!searchTerm) return this.palaces;

    const term = searchTerm.toLowerCase();
    return this.palaces.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.location?.toLowerCase().includes(term) ||
        p.book?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(term)),
    );
  }

  /**
   * Export single palace
   */
  exportPalace(id) {
    const palace = this.getPalaceById(id);
    if (!palace) return null;

    const dataStr = JSON.stringify(palace, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    return {
      blob,
      filename: `palace-${(palace.name || 'untitled').replace(/\s+/g, '-')}.json`,
    };
  }

  /**
   * Export all palaces
   */
  exportAllPalaces() {
    if (this.palaces.length === 0) return null;

    const dataStr = JSON.stringify(this.palaces, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    return {
      blob,
      filename: `all-memory-palaces-${new Date().toISOString().split('T')[0]}.json`,
    };
  }

  /**
   * Import palace(s) — creates new objects to avoid mutating the caller's input.
   */
  importPalaces(data) {
    const items = Array.isArray(data) ? data : [data];
    const now = new Date().toISOString();

    const imported = items.map((item) => ({
      ...item,
      id: generateId(),
      importedAt: now,
    }));

    this.palaces.push(...imported);
    this.saveToStorage();
    imported.forEach((palace) => this.syncManager?.uploadPalace(palace));
    eventBus.emit('palaces:changed', { reason: 'import', count: imported.length });
    return imported;
  }

  _getUniqueCopyName(baseName) {
    const existingNames = new Set(this.palaces.map((p) => p.name));

    let copyName = `${baseName} (Copy)`;
    if (!existingNames.has(copyName)) return copyName;

    let counter = 2;
    while (existingNames.has(`${baseName} (Copy ${counter})`)) {
      counter++;
    }
    return `${baseName} (Copy ${counter})`;
  }
}
