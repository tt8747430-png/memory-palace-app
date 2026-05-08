import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PalaceManager } from '../src/js/modules/PalaceManager.js';

// Mock localStorage with an in-memory store
const store = {};
const mockLocalStorage = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => {
    store[key] = String(value);
  }),
  removeItem: vi.fn((key) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  }),
};
vi.stubGlobal('localStorage', mockLocalStorage);

// Ensure crypto.randomUUID is available for ID generation
vi.stubGlobal('crypto', {
  randomUUID: () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
});

describe('PalaceManager', () => {
  let pm;

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    pm = new PalaceManager();
  });

  describe('CRUD operations', () => {
    it('starts with an empty list', () => {
      expect(pm.getAllPalaces()).toEqual([]);
    });

    it('creates a palace with auto-generated id and timestamps', () => {
      const palace = pm.createPalace({ name: 'Test', location: 'Home' });

      expect(palace.id).toBeTruthy();
      expect(palace.name).toBe('Test');
      expect(palace.createdAt).toBeTruthy();
      expect(palace.updatedAt).toBeTruthy();
      expect(pm.getAllPalaces()).toHaveLength(1);
    });

    it('retrieves a palace by ID', () => {
      const created = pm.createPalace({ name: 'Find Me', location: 'Office' });
      const found = pm.getPalaceById(created.id);

      expect(found).toBeTruthy();
      expect(found.name).toBe('Find Me');
    });

    it('returns undefined for non-existent ID', () => {
      expect(pm.getPalaceById('nonexistent')).toBeUndefined();
    });

    it('updates a palace and refreshes updatedAt', async () => {
      const created = pm.createPalace({ name: 'Original', location: 'A' });
      const originalUpdatedAt = created.updatedAt;

      // Small delay to ensure timestamp differs
      await new Promise((r) => setTimeout(r, 5));
      const updated = pm.updatePalace(created.id, { name: 'Updated' });

      expect(updated.name).toBe('Updated');
      expect(updated.location).toBe('A'); // preserved
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime(),
      );
    });

    it('returns null when updating non-existent palace', () => {
      expect(pm.updatePalace('nonexistent', { name: 'Fail' })).toBeNull();
    });

    it('deletes a palace', () => {
      const palace = pm.createPalace({ name: 'Delete Me', location: 'X' });
      const result = pm.deletePalace(palace.id);

      expect(result).toBeTruthy();
      expect(result.palace.name).toBe('Delete Me');
      expect(pm.getAllPalaces()).toHaveLength(0);
    });

    it('returns null when deleting non-existent palace', () => {
      expect(pm.deletePalace('nonexistent')).toBeNull();
    });

    it('cleans up connections when a palace is deleted', () => {
      const p1 = pm.createPalace({ name: 'A', location: 'X' });
      pm.createPalace({ name: 'B', location: 'Y', connections: [p1.id] });

      pm.deletePalace(p1.id);

      const remaining = pm.getAllPalaces()[0];
      expect(remaining.connections).toEqual([]);
    });
  });

  describe('duplicatePalace', () => {
    it('creates a copy with a new ID and suffixed name', () => {
      const original = pm.createPalace({ name: 'Original', location: 'A', tags: ['test'] });
      const copy = pm.duplicatePalace(original.id);

      expect(copy).toBeTruthy();
      expect(copy.id).not.toBe(original.id);
      expect(copy.name).toBe('Original (Copy)');
      expect(copy.tags).toEqual(['test']);
      expect(pm.getAllPalaces()).toHaveLength(2);
    });

    it('returns null for non-existent palace', () => {
      expect(pm.duplicatePalace('nonexistent')).toBeNull();
    });

    it('generates unique copy names when duplicating multiple times', () => {
      const original = pm.createPalace({ name: 'Test', location: 'A' });
      const copy1 = pm.duplicatePalace(original.id);
      const copy2 = pm.duplicatePalace(original.id);

      expect(copy1.name).toBe('Test (Copy)');
      expect(copy2.name).toBe('Test (Copy 2)');
    });
  });

  describe('restoreDeletedPalace', () => {
    it('restores a deleted palace and its connections', () => {
      const p1 = pm.createPalace({ name: 'A', location: 'X' });
      pm.createPalace({ name: 'B', location: 'Y', connections: [p1.id] });

      const deletedRecord = pm.deletePalace(p1.id, { skipSync: true });
      expect(pm.getAllPalaces()).toHaveLength(1);

      const restored = pm.restoreDeletedPalace(deletedRecord);
      expect(restored).toBeTruthy();
      expect(pm.getAllPalaces()).toHaveLength(2);

      const b = pm.getAllPalaces().find((p) => p.name === 'B');
      expect(b.connections).toContain(p1.id);
    });

    it('returns null if palace already exists', () => {
      const palace = pm.createPalace({ name: 'A', location: 'X' });
      const deletedRecord = pm.deletePalace(palace.id, { skipSync: true });
      pm.restoreDeletedPalace(deletedRecord);

      // Try restoring again — should return null
      expect(pm.restoreDeletedPalace(deletedRecord)).toBeNull();
    });
  });

  describe('searchPalaces', () => {
    it('returns all palaces when search term is empty', () => {
      pm.createPalace({ name: 'A', location: 'X' });
      pm.createPalace({ name: 'B', location: 'Y' });

      expect(pm.searchPalaces('')).toHaveLength(2);
    });

    it('searches by name', () => {
      pm.createPalace({ name: 'Ioan 16', location: 'Church' });
      pm.createPalace({ name: 'Matei 5', location: 'Mountain' });

      expect(pm.searchPalaces('Ioan')).toHaveLength(1);
    });

    it('searches by location', () => {
      pm.createPalace({ name: 'A', location: 'Church' });
      pm.createPalace({ name: 'B', location: 'Mountain' });

      expect(pm.searchPalaces('church')).toHaveLength(1);
    });

    it('searches by tags', () => {
      pm.createPalace({ name: 'A', location: 'X', tags: ['Gospel'] });
      pm.createPalace({ name: 'B', location: 'Y', tags: ['Epistles'] });

      expect(pm.searchPalaces('gospel')).toHaveLength(1);
    });
  });

  describe('import / export', () => {
    it('imports a single palace', () => {
      const result = pm.importPalaces({ name: 'Imported', location: 'Far' });

      expect(result).toHaveLength(1);
      expect(result[0].importedAt).toBeTruthy();
      expect(pm.getAllPalaces()).toHaveLength(1);
    });

    it('imports multiple palaces', () => {
      const result = pm.importPalaces([
        { name: 'A', location: 'X' },
        { name: 'B', location: 'Y' },
      ]);

      expect(result).toHaveLength(2);
      expect(pm.getAllPalaces()).toHaveLength(2);
    });

    it('exports a single palace', () => {
      const palace = pm.createPalace({ name: 'Export Me', location: 'Z' });
      const exported = pm.exportPalace(palace.id);

      expect(exported).toBeTruthy();
      expect(exported.filename).toContain('Export-Me');
      expect(exported.blob).toBeInstanceOf(Blob);
    });

    it('returns null when exporting non-existent palace', () => {
      expect(pm.exportPalace('nonexistent')).toBeNull();
    });

    it('exports all palaces', () => {
      pm.createPalace({ name: 'A', location: 'X' });
      pm.createPalace({ name: 'B', location: 'Y' });

      const exported = pm.exportAllPalaces();
      expect(exported).toBeTruthy();
      expect(exported.blob).toBeInstanceOf(Blob);
    });

    it('returns null when exporting with no palaces', () => {
      expect(pm.exportAllPalaces()).toBeNull();
    });
  });

  describe('persistence', () => {
    it('saves to localStorage on create', () => {
      pm.createPalace({ name: 'Persist', location: 'Store' });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('loads persisted data on new instance', () => {
      pm.createPalace({ name: 'Persist', location: 'Store' });

      const pm2 = new PalaceManager();
      expect(pm2.getAllPalaces()).toHaveLength(1);
      expect(pm2.getAllPalaces()[0].name).toBe('Persist');
    });

    it('uses scoped storage keys', () => {
      pm.setStorageScope('user123');
      pm.createPalace({ name: 'Scoped', location: 'S' });

      const pm2 = new PalaceManager();
      pm2.setStorageScope('user123');
      expect(pm2.getAllPalaces()).toHaveLength(1);

      // Guest scope should be empty (different key)
      const pm3 = new PalaceManager();
      expect(pm3.getAllPalaces()).toHaveLength(0);
    });
  });

  describe('replaceAll', () => {
    it('replaces the entire palace list', () => {
      pm.createPalace({ name: 'Old', location: 'X' });

      pm.replaceAll([
        { id: 'new-1', name: 'New A', location: 'Y' },
        { id: 'new-2', name: 'New B', location: 'Z' },
      ]);

      expect(pm.getAllPalaces()).toHaveLength(2);
      expect(pm.getPalaceById('new-1').name).toBe('New A');
    });
  });

  describe('error handling', () => {
    it('handles loadFromStorage parse error gracefully', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLocalStorage.getItem.mockReturnValue('invalid json{{{');

      const pm2 = new PalaceManager();
      expect(pm2.getAllPalaces()).toEqual([]);
      vi.restoreAllMocks();
    });

    it('handles saveToStorage QuotaExceededError', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new Error('Storage full');
      err.name = 'QuotaExceededError';
      mockLocalStorage.setItem.mockImplementation(() => {
        throw err;
      });

      // Should not throw
      pm.createPalace({ name: 'Too Big', location: 'X' });
      vi.restoreAllMocks();
    });

    it('handles saveToStorage generic error', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('generic');
      });

      pm.createPalace({ name: 'Error', location: 'X' });
      vi.restoreAllMocks();
    });

    it('handles _migrateLegacyStorage error gracefully', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('fail');
      });

      const pm2 = new PalaceManager();
      expect(pm2).toBeTruthy();
      vi.restoreAllMocks();
    });
  });

  describe('_migrateLegacyStorage', () => {
    it('migrates legacy data when scoped key does not exist', () => {
      const legacyData = JSON.stringify([{ id: 'old', name: 'Legacy' }]);
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'memoryPalaces') return legacyData;
        return null;
      });

      new PalaceManager();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('setStorageScope', () => {
    it('does not reload when scope is same', () => {
      const callsBefore = mockLocalStorage.getItem.mock.calls.length;
      pm.setStorageScope('guest');
      expect(mockLocalStorage.getItem.mock.calls.length).toBe(callsBefore);
    });
  });

  describe('_getUniqueCopyName', () => {
    it('generates numbered copy names beyond Copy 2', () => {
      pm.createPalace({ name: 'A', location: 'X' });
      pm.createPalace({ name: 'A (Copy)', location: 'X' });
      pm.createPalace({ name: 'A (Copy 2)', location: 'X' });

      const original = pm.getAllPalaces().find((p) => p.name === 'A');
      const copy = pm.duplicatePalace(original.id);
      expect(copy.name).toBe('A (Copy 3)');
    });
  });

  describe('restoreDeletedPalace edge cases', () => {
    it('returns null when deletedRecord is null', () => {
      expect(pm.restoreDeletedPalace(null)).toBeNull();
    });

    it('returns null when deletedRecord has no palace', () => {
      expect(pm.restoreDeletedPalace({})).toBeNull();
    });
  });

  describe('generateId fallback', () => {
    it('falls back to timestamp-based ID when crypto.randomUUID is unavailable', () => {
      const origCrypto = globalThis.crypto;
      vi.stubGlobal('crypto', undefined);

      const pm2 = new PalaceManager();
      const palace = pm2.createPalace({ name: 'Fallback', location: 'X' });
      expect(palace.id).toBeTruthy();
      expect(typeof palace.id).toBe('string');

      vi.stubGlobal('crypto', origCrypto);
    });
  });

  describe('getAllPalaces mutation safety', () => {
    it('returns a copy — mutating the result does not affect internal state', () => {
      pm.createPalace({ name: 'Safe', location: 'X' });
      const list = pm.getAllPalaces();
      list.push({ id: 'injected', name: 'Injected' });
      expect(pm.getAllPalaces()).toHaveLength(1);
    });
  });

  describe('importPalaces no input mutation', () => {
    it('does not mutate the original input object when importing a single palace', () => {
      const input = { name: 'Import Me', location: 'Z' };
      pm.importPalaces(input);
      expect(Object.keys(input)).not.toContain('id');
    });

    it('does not mutate the original input objects when importing an array', () => {
      const inputs = [
        { name: 'A', location: 'X' },
        { name: 'B', location: 'Y' },
      ];
      pm.importPalaces(inputs);
      inputs.forEach((inp) => expect(Object.keys(inp)).not.toContain('id'));
    });
  });

  describe('QuotaExceededError notifies user', () => {
    it('calls notificationManager.error when storage quota is exceeded', () => {
      const notificationManager = { error: vi.fn() };
      const pm2 = new PalaceManager(null, notificationManager);
      const err = new Error('Storage full');
      err.name = 'QuotaExceededError';
      mockLocalStorage.setItem.mockImplementation(() => {
        throw err;
      });

      pm2.createPalace({ name: 'Big', location: 'X' });

      expect(notificationManager.error).toHaveBeenCalledWith(
        expect.stringContaining('Storage full'),
      );
      vi.restoreAllMocks();
    });
  });
});
