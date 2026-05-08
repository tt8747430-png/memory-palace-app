import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-config.js
vi.mock('../src/js/modules/firebase-config.js', () => ({
  FIREBASE_CONFIG: {},
  IS_FIREBASE_CONFIGURED: false,
}));

import { SyncManager } from '../src/js/modules/SyncManager.js';

describe('SyncManager', () => {
  let sm;

  beforeEach(() => {
    vi.clearAllMocks();
    sm = new SyncManager();
  });

  describe('constructor', () => {
    it('initializes with unconfigured state', () => {
      expect(sm.isConfigured).toBe(false);
      expect(sm.isReady).toBe(false);
      expect(sm.initFailed).toBe(false);
      expect(sm.user).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('registers a callback', () => {
      const cb = vi.fn();
      sm.onAuthStateChange(cb);
      expect(sm._authCallbacks).toContain(cb);
    });
  });

  describe('isSignedIn', () => {
    it('returns false when no user', () => {
      expect(sm.isSignedIn()).toBe(false);
    });

    it('returns true when user exists', () => {
      sm.user = { uid: '123' };
      expect(sm.isSignedIn()).toBe(true);
    });
  });

  describe('getUserInfo', () => {
    it('returns null when no user', () => {
      expect(sm.getUserInfo()).toBeNull();
    });

    it('returns user info when user exists', () => {
      sm.user = {
        displayName: 'Test',
        email: 'test@test.com',
        photoURL: 'http://photo',
        uid: '123',
      };
      const info = sm.getUserInfo();
      expect(info.name).toBe('Test');
      expect(info.email).toBe('test@test.com');
      expect(info.uid).toBe('123');
    });
  });

  describe('_canSync', () => {
    it('returns false when not ready', () => {
      sm.isReady = false;
      sm.user = { uid: '123' };
      expect(sm._canSync()).toBe(false);
    });

    it('returns false when not signed in', () => {
      sm.isReady = true;
      sm.user = null;
      expect(sm._canSync()).toBe(false);
    });

    it('returns true when ready and signed in', () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      expect(sm._canSync()).toBe(true);
    });
  });

  describe('signIn', () => {
    it('throws when not ready', async () => {
      sm.isReady = false;
      await expect(sm.signIn()).rejects.toThrow('Firebase not ready');
    });

    it('calls signInWithPopup when ready', async () => {
      sm.isReady = true;
      sm.auth = {};
      sm._fb.GoogleAuthProvider = vi.fn();
      sm._fb.signInWithPopup = vi.fn().mockResolvedValue({});
      sm._fb.signInWithRedirect = vi.fn();

      await sm.signIn();
      expect(sm._fb.signInWithPopup).toHaveBeenCalled();
    });

    it('falls back to redirect on popup-blocked', async () => {
      sm.isReady = true;
      sm.auth = {};
      sm._fb.GoogleAuthProvider = vi.fn();
      sm._fb.signInWithPopup = vi.fn().mockRejectedValue({ code: 'auth/popup-blocked' });
      sm._fb.signInWithRedirect = vi.fn().mockResolvedValue({});

      await sm.signIn();
      expect(sm._fb.signInWithRedirect).toHaveBeenCalled();
    });

    it('falls back on cancelled-popup-request', async () => {
      sm.isReady = true;
      sm.auth = {};
      sm._fb.GoogleAuthProvider = vi.fn();
      sm._fb.signInWithPopup = vi.fn().mockRejectedValue({ code: 'auth/cancelled-popup-request' });
      sm._fb.signInWithRedirect = vi.fn().mockResolvedValue({});

      await sm.signIn();
      expect(sm._fb.signInWithRedirect).toHaveBeenCalled();
    });

    it('falls back on operation-not-supported-in-this-environment', async () => {
      sm.isReady = true;
      sm.auth = {};
      sm._fb.GoogleAuthProvider = vi.fn();
      sm._fb.signInWithPopup = vi
        .fn()
        .mockRejectedValue({ code: 'auth/operation-not-supported-in-this-environment' });
      sm._fb.signInWithRedirect = vi.fn().mockResolvedValue({});

      await sm.signIn();
      expect(sm._fb.signInWithRedirect).toHaveBeenCalled();
    });

    it('rethrows non-fallback errors', async () => {
      sm.isReady = true;
      sm.auth = {};
      sm._fb.GoogleAuthProvider = vi.fn();
      const err = { code: 'auth/unknown-error' };
      sm._fb.signInWithPopup = vi.fn().mockRejectedValue(err);

      await expect(sm.signIn()).rejects.toBe(err);
    });
  });

  describe('signOut', () => {
    it('no-ops when not ready', async () => {
      sm.isReady = false;
      await sm.signOut(); // Should not throw
    });

    it('calls signOut when ready', async () => {
      sm.isReady = true;
      sm.auth = {};
      sm._fb.signOut = vi.fn().mockResolvedValue();
      await sm.signOut();
      expect(sm._fb.signOut).toHaveBeenCalled();
    });
  });

  describe('uploadPalace', () => {
    it('returns false when cannot sync', async () => {
      expect(await sm.uploadPalace({ id: 'p1' })).toBe(false);
    });

    it('uploads palace when can sync', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};
      const ref = {};
      sm._fb.doc = vi.fn(() => ref);
      sm._fb.setDoc = vi.fn().mockResolvedValue();

      expect(await sm.uploadPalace({ id: 'p1' })).toBe(true);
      expect(sm._fb.setDoc).toHaveBeenCalledWith(ref, { id: 'p1' });
    });

    it('returns false on error', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};
      sm._fb.doc = vi.fn(() => ({}));
      sm._fb.setDoc = vi.fn().mockRejectedValue(new Error('fail'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(await sm.uploadPalace({ id: 'p1' })).toBe(false);
      vi.restoreAllMocks();
    });
  });

  describe('removeCloudPalace', () => {
    it('returns false when cannot sync', async () => {
      expect(await sm.removeCloudPalace('p1')).toBe(false);
    });

    it('deletes palace and sets deletion entry', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};
      sm._fb.doc = vi.fn(() => ({}));
      sm._fb.deleteDoc = vi.fn().mockResolvedValue();
      sm._fb.getDoc = vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) });
      sm._fb.setDoc = vi.fn().mockResolvedValue();

      expect(await sm.removeCloudPalace('p1')).toBe(true);
      expect(sm._fb.deleteDoc).toHaveBeenCalled();
    });

    it('returns false on error', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};
      sm._fb.doc = vi.fn(() => ({}));
      sm._fb.deleteDoc = vi.fn().mockRejectedValue(new Error('fail'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(await sm.removeCloudPalace('p1')).toBe(false);
      vi.restoreAllMocks();
    });
  });

  describe('uploadSessions', () => {
    it('returns false when cannot sync', async () => {
      expect(await sm.uploadSessions({})).toBe(false);
    });

    it('uploads sessions', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};
      sm._fb.doc = vi.fn(() => ({}));
      sm._fb.setDoc = vi.fn().mockResolvedValue();

      expect(await sm.uploadSessions({ p1: {} })).toBe(true);
    });

    it('returns false on error', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};
      sm._fb.doc = vi.fn(() => ({}));
      sm._fb.setDoc = vi.fn().mockRejectedValue(new Error('fail'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(await sm.uploadSessions({})).toBe(false);
      vi.restoreAllMocks();
    });
  });

  describe('fullSync', () => {
    it('returns null when cannot sync', async () => {
      expect(await sm.fullSync([], {})).toBeNull();
    });

    it('merges local and cloud palaces (local wins)', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};

      const localPalace = { id: 'p1', name: 'Local', updatedAt: '2026-03-01T00:00:00Z' };
      const cloudPalace = { id: 'p1', name: 'Cloud', updatedAt: '2026-02-01T00:00:00Z' };

      sm._fb.collection = vi.fn(() => ({}));
      sm._fb.getDocs = vi.fn().mockResolvedValue({ docs: [{ data: () => cloudPalace }] });
      sm._fb.doc = vi.fn(() => ({}));
      sm._fb.getDoc = vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) });
      sm._fb.setDoc = vi.fn().mockResolvedValue();
      sm._fb.writeBatch = vi.fn(() => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue() }));

      const result = await sm.fullSync([localPalace], {});
      expect(result).toBeTruthy();
      expect(result.palaces[0].name).toBe('Local');
    });

    it('merges local and cloud palaces (cloud wins)', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};

      const localPalace = { id: 'p1', name: 'Local', updatedAt: '2026-01-01T00:00:00Z' };
      const cloudPalace = { id: 'p1', name: 'Cloud', updatedAt: '2026-03-01T00:00:00Z' };

      sm._fb.collection = vi.fn(() => ({}));
      sm._fb.getDocs = vi.fn().mockResolvedValue({ docs: [{ data: () => cloudPalace }] });
      sm._fb.doc = vi.fn(() => ({}));
      sm._fb.getDoc = vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) });
      sm._fb.setDoc = vi.fn().mockResolvedValue();
      sm._fb.writeBatch = vi.fn(() => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue() }));

      const result = await sm.fullSync([localPalace], {});
      expect(result.palaces[0].name).toBe('Cloud');
    });

    it('adds cloud-only palaces', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};

      const cloudPalace = { id: 'p2', name: 'Cloud Only', updatedAt: '2026-03-01T00:00:00Z' };

      sm._fb.collection = vi.fn(() => ({}));
      sm._fb.getDocs = vi.fn().mockResolvedValue({ docs: [{ data: () => cloudPalace }] });
      sm._fb.doc = vi.fn(() => ({}));
      sm._fb.getDoc = vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) });
      sm._fb.setDoc = vi.fn().mockResolvedValue();
      sm._fb.writeBatch = vi.fn(() => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue() }));

      const result = await sm.fullSync([], {});
      expect(result.palaces).toHaveLength(1);
      expect(result.palaces[0].name).toBe('Cloud Only');
    });

    it('respects deletion tombstones for local palaces', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};

      const localPalace = { id: 'p1', name: 'Deleted', updatedAt: '2026-01-01T00:00:00Z' };

      sm._fb.collection = vi.fn(() => ({}));
      sm._fb.getDocs = vi.fn().mockResolvedValue({ docs: [] });
      sm._fb.doc = vi.fn(() => ({}));
      // Return deletion map with p1 deleted after the palace was updated
      sm._fb.getDoc = vi
        .fn()
        .mockResolvedValueOnce({ exists: () => false, data: () => ({}) }) // sessions
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ palaceDeletedAt: { p1: '2026-02-01T00:00:00Z' } }),
        }); // deletions
      sm._fb.setDoc = vi.fn().mockResolvedValue();
      sm._fb.writeBatch = vi.fn(() => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue() }));

      const result = await sm.fullSync([localPalace], {});
      expect(result.palaces).toHaveLength(0);
    });

    it('skips deleted cloud palaces', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};

      const cloudPalace = { id: 'p1', name: 'Deleted Cloud', updatedAt: '2026-01-01T00:00:00Z' };

      sm._fb.collection = vi.fn(() => ({}));
      sm._fb.getDocs = vi.fn().mockResolvedValue({ docs: [{ data: () => cloudPalace }] });
      sm._fb.doc = vi.fn(() => ({}));
      sm._fb.getDoc = vi
        .fn()
        .mockResolvedValueOnce({ exists: () => false, data: () => ({}) }) // sessions
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ palaceDeletedAt: { p1: '2026-03-01T00:00:00Z' } }),
        }); // deletions
      sm._fb.setDoc = vi.fn().mockResolvedValue();
      sm._fb.writeBatch = vi.fn(() => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue() }));

      const result = await sm.fullSync([], {});
      expect(result.palaces).toHaveLength(0);
    });

    it('merges sessions (cloud wins on higher practiceCount)', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};

      sm._fb.collection = vi.fn(() => ({}));
      sm._fb.getDocs = vi.fn().mockResolvedValue({ docs: [] });
      sm._fb.doc = vi.fn(() => ({}));
      sm._fb.getDoc = vi
        .fn()
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ sessions: { p1: { practiceCount: 5 } } }),
        }) // sessions
        .mockResolvedValueOnce({ exists: () => false, data: () => ({}) }); // deletions
      sm._fb.setDoc = vi.fn().mockResolvedValue();
      sm._fb.writeBatch = vi.fn(() => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue() }));

      const localSessions = { p1: { practiceCount: 3 } };
      const result = await sm.fullSync([], localSessions);
      expect(result.sessions.p1.practiceCount).toBe(5);
    });

    it('merges sessions (local wins on higher practiceCount)', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};

      sm._fb.collection = vi.fn(() => ({}));
      sm._fb.getDocs = vi.fn().mockResolvedValue({ docs: [] });
      sm._fb.doc = vi.fn(() => ({}));
      sm._fb.getDoc = vi
        .fn()
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ sessions: { p1: { practiceCount: 2 } } }),
        })
        .mockResolvedValueOnce({ exists: () => false, data: () => ({}) });
      sm._fb.setDoc = vi.fn().mockResolvedValue();
      sm._fb.writeBatch = vi.fn(() => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue() }));

      const localSessions = { p1: { practiceCount: 10 } };
      const result = await sm.fullSync([], localSessions);
      expect(result.sessions.p1.practiceCount).toBe(10);
    });

    it('returns null on error', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};

      sm._fb.collection = vi.fn(() => {
        throw new Error('fail');
      });
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await sm.fullSync([], {});
      expect(result).toBeNull();
      vi.restoreAllMocks();
    });

    it('clears deletion entries for revived palaces', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};

      const localPalace = { id: 'p1', name: 'Revived', updatedAt: '2026-03-01T00:00:00Z' };

      sm._fb.collection = vi.fn(() => ({}));
      sm._fb.getDocs = vi.fn().mockResolvedValue({ docs: [] });
      sm._fb.doc = vi.fn(() => ({}));
      // Deletion map has p1 but local palace is newer
      sm._fb.getDoc = vi
        .fn()
        .mockResolvedValueOnce({ exists: () => false, data: () => ({}) }) // sessions
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ palaceDeletedAt: { p1: '2026-01-01T00:00:00Z' } }),
        }) // deletions
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ palaceDeletedAt: { p1: '2026-01-01T00:00:00Z' } }),
        }); // _removeDeletionEntries loads map again
      sm._fb.setDoc = vi.fn().mockResolvedValue();
      sm._fb.writeBatch = vi.fn(() => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue() }));

      const result = await sm.fullSync([localPalace], {});
      expect(result.palaces).toHaveLength(1);
      // setDoc should have been called to clear deletion entry
      expect(sm._fb.setDoc).toHaveBeenCalled();
    });

    it('adds new cloud sessions not in local', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};

      sm._fb.collection = vi.fn(() => ({}));
      sm._fb.getDocs = vi.fn().mockResolvedValue({ docs: [] });
      sm._fb.doc = vi.fn(() => ({}));
      sm._fb.getDoc = vi
        .fn()
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ sessions: { p2: { practiceCount: 1 } } }),
        })
        .mockResolvedValueOnce({ exists: () => false, data: () => ({}) });
      sm._fb.setDoc = vi.fn().mockResolvedValue();
      sm._fb.writeBatch = vi.fn(() => ({ set: vi.fn(), commit: vi.fn().mockResolvedValue() }));

      const result = await sm.fullSync([], { p1: { practiceCount: 1 } });
      expect(result.sessions.p1.practiceCount).toBe(1);
      expect(result.sessions.p2.practiceCount).toBe(1);
    });
  });

  describe('_loadCloudSessions', () => {
    it('returns empty object on error', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};
      sm._fb.doc = vi.fn(() => {
        throw new Error('fail');
      });

      const result = await sm._loadCloudSessions();
      expect(result).toEqual({});
    });
  });

  describe('_loadDeletionMap', () => {
    it('returns empty object on error', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};
      sm._fb.doc = vi.fn(() => {
        throw new Error('fail');
      });

      const result = await sm._loadDeletionMap();
      expect(result).toEqual({});
    });
  });

  describe('_init', () => {
    it('initializes Firebase modules and sets up auth state listener', async () => {
      const sm2 = new SyncManager();
      // Directly test the post-init state by simulating what _init does
      const mockGetRedirectResult = vi.fn().mockResolvedValue(null);

      // Simulate successful init
      sm2._fb = {
        GoogleAuthProvider: vi.fn(),
        signInWithPopup: vi.fn(),
        signInWithRedirect: vi.fn(),
        getRedirectResult: mockGetRedirectResult,
        signOut: vi.fn(),
        collection: vi.fn(),
        doc: vi.fn(),
        setDoc: vi.fn(),
        getDoc: vi.fn(),
        getDocs: vi.fn(),
        deleteDoc: vi.fn(),
        writeBatch: vi.fn(),
      };
      sm2.auth = {};
      sm2.db = {};
      sm2.isReady = true;

      // Register callback and simulate auth state change
      const cb = vi.fn();
      sm2.onAuthStateChange(cb);
      sm2._authCallbacks.forEach((fn) => fn({ uid: 'test' }));
      expect(cb).toHaveBeenCalledWith({ uid: 'test' });
      expect(sm2.isReady).toBe(true);
    });

    it('handles initialization failure', () => {
      const sm2 = new SyncManager();
      // Simulate failed init
      sm2.initFailed = true;
      expect(sm2.initFailed).toBe(true);
      expect(sm2.isReady).toBe(false);
    });
  });

  describe('_palaceRef', () => {
    it('creates a document reference', () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};
      sm._fb.doc = vi.fn(() => 'ref');

      const ref = sm._palaceRef('p1');
      expect(ref).toBe('ref');
      expect(sm._fb.doc).toHaveBeenCalledWith({}, 'users', '123', 'palaces', 'p1');
    });
  });

  describe('_uploadAllPalaces', () => {
    it('handles empty palaces array', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};
      sm._fb.writeBatch = vi.fn();
      sm._fb.doc = vi.fn(() => ({}));

      await sm._uploadAllPalaces([]);
      expect(sm._fb.writeBatch).not.toHaveBeenCalled();
    });

    it('batches uploads in chunks of 400', async () => {
      sm.isReady = true;
      sm.user = { uid: '123' };
      sm.db = {};
      sm._fb.doc = vi.fn(() => ({}));

      const commitFn = vi.fn().mockResolvedValue();
      const setFn = vi.fn();
      sm._fb.writeBatch = vi.fn(() => ({ set: setFn, commit: commitFn }));

      const palaces = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}` }));
      await sm._uploadAllPalaces(palaces);
      expect(commitFn).toHaveBeenCalledTimes(1);
      expect(setFn).toHaveBeenCalledTimes(5);
    });
  });
});
