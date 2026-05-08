import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Test PracticeManager's pure business logic in isolation.
 * We mock localStorage to isolate tests from environment quirks.
 */
import { PracticeManager } from '../src/js/modules/PracticeManager.js';

// Mock localStorage with a simple in-memory store
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

describe('PracticeManager', () => {
  let pm;

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    pm = new PracticeManager();
  });

  describe('getInterval (spaced repetition)', () => {
    it('returns 1 day for first practice (count 0)', () => {
      expect(pm.getInterval(0)).toBe(1);
    });

    it('returns 3 days for second practice (count 1)', () => {
      expect(pm.getInterval(1)).toBe(3);
    });

    it('returns 7 days for third practice (count 2)', () => {
      expect(pm.getInterval(2)).toBe(7);
    });

    it('caps at 120 days for very high counts', () => {
      expect(pm.getInterval(100)).toBe(120);
      expect(pm.getInterval(50)).toBe(120);
    });

    it('follows the full interval sequence', () => {
      const expected = [1, 3, 7, 14, 30, 60, 120];
      expected.forEach((interval, index) => {
        expect(pm.getInterval(index)).toBe(interval);
      });
    });
  });

  describe('getPracticeData', () => {
    it('returns default data for unknown palace', () => {
      const data = pm.getPracticeData('unknown-id');
      expect(data.practiceCount).toBe(0);
      expect(data.streak).toBe(0);
      expect(data.mastery).toBe(0);
      expect(data.lastPracticed).toBeNull();
    });

    it('returns consistent data for same palace on repeated calls', () => {
      const data1 = pm.getPracticeData('test-id');
      const data2 = pm.getPracticeData('test-id');
      expect(data1).toStrictEqual(data2);
    });
  });

  describe('recordPractice', () => {
    it('records a practice session and updates stats', () => {
      const result = pm.recordPractice('palace-1', {
        score: 80,
        stationScores: { 1: true, 2: false },
        totalQuestions: 2,
        correctAnswers: 1,
        mode: 'quiz',
      });

      expect(result.practiceCount).toBe(1);
      expect(result.mastery).toBe(80);
      expect(result.streak).toBe(1);
      expect(result.lastScore).toBe(80);
      expect(result.bestScore).toBe(80);
      expect(result.lastPracticed).toBeTruthy();
    });

    it('updates mastery as rolling average', () => {
      pm.recordPractice('palace-1', { score: 100 });
      const result = pm.recordPractice('palace-1', { score: 60 });

      // Rolling average of 100 and 60 = 80
      expect(result.mastery).toBe(80);
    });

    it('tracks best score', () => {
      pm.recordPractice('palace-1', { score: 90 });
      pm.recordPractice('palace-1', { score: 60 });
      const data = pm.getPracticeData('palace-1');

      expect(data.bestScore).toBe(90);
    });

    it('tracks station progress', () => {
      pm.recordPractice('palace-1', {
        score: 75,
        stationScores: { 1: true, 2: false, 3: true },
      });

      const data = pm.getPracticeData('palace-1');
      expect(data.stationProgress['1'].correct).toBe(1);
      expect(data.stationProgress['1'].total).toBe(1);
      expect(data.stationProgress['2'].correct).toBe(0);
      expect(data.stationProgress['2'].total).toBe(1);
    });

    it('keeps history capped at 25 entries', () => {
      for (let i = 0; i < 30; i++) {
        pm.recordPractice('palace-1', { score: 50 + i });
      }
      const data = pm.getPracticeData('palace-1');
      expect(data.history.length).toBe(25);
    });

    it('handles legacy numeric score argument', () => {
      const result = pm.recordPractice('palace-1', 85, { 1: true });
      expect(result.mastery).toBe(85);
      expect(result.practiceCount).toBe(1);
    });

    it('persists to localStorage', () => {
      pm.recordPractice('palace-1', { score: 70 });

      // Verify setItem was called with serialized sessions
      expect(mockLocalStorage.setItem).toHaveBeenCalled();

      // Create a new instance — it will load from our mock store
      const pm2 = new PracticeManager();
      const data = pm2.getPracticeData('palace-1');
      expect(data.practiceCount).toBe(1);
      expect(data.mastery).toBe(70);
    });
  });

  describe('getNextReviewDate', () => {
    it('returns "Now" for never-practiced palace', () => {
      expect(pm.getNextReviewDate('new-palace')).toBe('Now');
    });

    it('returns "Today" if overdue', () => {
      // Seed data directly on sessions — getPracticeData now returns a copy, not a live reference
      pm.sessions['palace-1'] = {
        ...pm.getDefaultPracticeData(),
        lastPracticed: new Date(Date.now() - 10 * 86400000).toISOString(),
        practiceCount: 1,
      };

      // Interval for count=1 is 3 days, so 10 days ago is overdue
      expect(pm.getNextReviewDate('palace-1')).toBe('Today');
    });
  });

  describe('getDuePalaces', () => {
    it('includes never-practiced palaces', () => {
      const palaces = [{ id: 'new-1' }, { id: 'new-2' }];
      const due = pm.getDuePalaces(palaces);
      expect(due).toHaveLength(2);
    });

    it('excludes recently-practiced palaces', () => {
      pm.recordPractice('recent', { score: 80 });
      const palaces = [{ id: 'recent' }];
      const due = pm.getDuePalaces(palaces);
      expect(due).toHaveLength(0);
    });
  });

  describe('getGlobalStats', () => {
    it('returns correct totals', () => {
      pm.recordPractice('p1', { score: 80 });
      pm.recordPractice('p2', { score: 60 });
      const palaces = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];
      const stats = pm.getGlobalStats(palaces);

      expect(stats.totalPalaces).toBe(3);
      expect(stats.totalPracticed).toBe(2);
      expect(stats.totalSessions).toBe(2);
    });

    it('returns zero averages when no palaces', () => {
      const stats = pm.getGlobalStats([]);
      expect(stats.averageStreak).toBe(0);
      expect(stats.averageMastery).toBe(0);
    });
  });

  describe('streak logic', () => {
    it('continues streak when last practiced yesterday', () => {
      pm.sessions['palace-streak'] = {
        ...pm.getDefaultPracticeData(),
        lastPracticed: new Date(Date.now() - 86400000).toISOString(),
        streak: 3,
        practiceCount: 3,
      };

      const result = pm.recordPractice('palace-streak', { score: 90 });
      expect(result.streak).toBe(4);
    });

    it('resets streak when last practiced more than a day ago', () => {
      pm.sessions['palace-gap'] = {
        ...pm.getDefaultPracticeData(),
        lastPracticed: new Date(Date.now() - 5 * 86400000).toISOString(),
        streak: 5,
        practiceCount: 5,
      };

      const result = pm.recordPractice('palace-gap', { score: 70 });
      expect(result.streak).toBe(1);
    });

    it('keeps streak at least 1 when practicing same day', () => {
      pm.sessions['palace-today'] = {
        ...pm.getDefaultPracticeData(),
        lastPracticed: new Date().toISOString(),
        streak: 0,
        practiceCount: 1,
      };

      const result = pm.recordPractice('palace-today', { score: 80 });
      expect(result.streak).toBe(1);
    });
  });

  describe('getNextReviewDate', () => {
    it('returns "Tomorrow" when due tomorrow', () => {
      // Seed directly — getPracticeData returns a copy now
      pm.sessions['palace-tm'] = {
        ...pm.getDefaultPracticeData(),
        lastPracticed: new Date().toISOString(),
        practiceCount: 0,
      };

      const result = pm.getNextReviewDate('palace-tm');
      expect(result).toBe('Tomorrow');
    });

    it('returns "In X days" for future dates', () => {
      pm.sessions['palace-future'] = {
        ...pm.getDefaultPracticeData(),
        lastPracticed: new Date().toISOString(),
        practiceCount: 3, // interval = 14 days
      };

      const result = pm.getNextReviewDate('palace-future');
      expect(result).toMatch(/In \d+ days/);
    });
  });

  describe('getWeakestPalaces', () => {
    it('sorts by mastery, then by practiceCount on tie', () => {
      pm.recordPractice('p1', { score: 50 });
      pm.recordPractice('p2', { score: 50 });
      pm.recordPractice('p2', { score: 50 }); // more practice
      const palaces = [
        { id: 'p1', name: 'Low' },
        { id: 'p2', name: 'Also Low' },
      ];
      const weakest = pm.getWeakestPalaces(palaces, 5);

      expect(weakest).toHaveLength(2);
      // p1 has fewer sessions, should be first on tie
      expect(weakest[0].id).toBe('p1');
    });
  });

  describe('getWeeklyActivity', () => {
    it('returns correct number of buckets with proper structure', () => {
      pm.recordPractice('p1', { score: 80 });

      const palaces = [{ id: 'p1' }];
      const weekly = pm.getWeeklyActivity(palaces, 7);

      expect(weekly).toHaveLength(7);
      // Each bucket should have label, key, and sessions count
      weekly.forEach((bucket) => {
        expect(bucket).toHaveProperty('label');
        expect(bucket).toHaveProperty('key');
        expect(typeof bucket.sessions).toBe('number');
        expect(bucket.sessions).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('_migrateLegacyStorage', () => {
    it('migrates legacy storage when scoped key does not exist', () => {
      const legacyData = JSON.stringify({ p1: { practiceCount: 1 } });
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'practiceSessions') return legacyData;
        return null;
      });

      new PracticeManager();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('handles migration error gracefully', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('fail');
      });

      // Should not throw
      const pm2 = new PracticeManager();
      expect(pm2).toBeTruthy();
      vi.restoreAllMocks();
    });
  });

  describe('loadSessions error handling', () => {
    it('returns empty object on parse error', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLocalStorage.getItem.mockReturnValue('invalid json{{{');

      const pm2 = new PracticeManager();
      expect(pm2.sessions).toEqual({});
      vi.restoreAllMocks();
    });
  });

  describe('saveSessions error handling', () => {
    it('handles QuotaExceededError', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new Error('Storage full');
      err.name = 'QuotaExceededError';
      mockLocalStorage.setItem.mockImplementation(() => {
        throw err;
      });

      pm.recordPractice('p1', { score: 80 });
      // Should not throw
      vi.restoreAllMocks();
    });

    it('handles generic save error', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('generic');
      });

      pm.recordPractice('p1', { score: 80 });
      vi.restoreAllMocks();
    });
  });

  describe('replaceSessions', () => {
    it('replaces sessions and saves', () => {
      pm.replaceSessions({ p1: { practiceCount: 5 } });
      expect(pm.sessions).toEqual({ p1: { practiceCount: 5 } });
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

  describe('getPracticeData no write side-effect', () => {
    it('does not create a session entry for an unseen palace when reading stats', () => {
      pm.getPracticeData('unknown-palace');
      expect(pm.sessions).not.toHaveProperty('unknown-palace');
    });

    it('returns a merged default object even for unseen palaces', () => {
      const data = pm.getPracticeData('unknown-palace');
      expect(data).toMatchObject({ practiceCount: 0, mastery: 0, streak: 0 });
    });
  });
});
