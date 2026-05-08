import { Logger } from './Logger.js';

/**
 * PracticeManager - Handles practice sessions and spaced repetition
 */
export class PracticeManager {
  constructor(syncManager = null, notificationManager = null) {
    this.baseStorageKey = 'practiceSessions';
    this.storageKey = '';
    this.syncManager = syncManager;
    this.notificationManager = notificationManager;
    this.sessions = {};
    this.setStorageScope('guest');
  }

  /** Switch between guest and user-scoped storage keys. */
  setStorageScope(scope = 'guest') {
    const nextKey = `${this.baseStorageKey}:${scope}`;
    if (this.storageKey === nextKey) return;

    this.storageKey = nextKey;
    this._migrateLegacyStorage();
    this.sessions = this.loadSessions();
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
      Logger.error('Error migrating practice storage key', { error: String(error) });
    }
  }

  /** Replace local sessions with merged cloud result */
  replaceSessions(sessions) {
    this.sessions = sessions;
    this.saveSessions();
  }

  loadSessions() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      Logger.error('Error loading practice sessions', { error: String(error) });
      return {};
    }
  }

  saveSessions() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.sessions));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        Logger.error('Storage quota exceeded! Export data and clear old sessions.', {
          error: String(error),
        });
        this.notificationManager?.error(
          '⚠️ Storage full! Export your data and delete old practice sessions to free space.',
        );
      } else {
        Logger.error('Error saving practice sessions', { error: String(error) });
      }
    }
  }

  getDefaultPracticeData() {
    return {
      lastPracticed: null,
      practiceCount: 0,
      streak: 0,
      mastery: 0,
      stationProgress: {},
      history: [],
      lastScore: 0,
      bestScore: 0,
    };
  }

  /**
   * Get practice data for a palace — returns a merged snapshot copy.
   * Does NOT write to this.sessions; use _ensurePracticeData() for mutations.
   */
  getPracticeData(palaceId) {
    return { ...this.getDefaultPracticeData(), ...(this.sessions[palaceId] || {}) };
  }

  /**
   * Internal: ensure an entry exists in this.sessions and return the live reference.
   * Only called by recordPractice() which needs to mutate the entry.
   */
  _ensurePracticeData(palaceId) {
    if (!this.sessions[palaceId]) {
      this.sessions[palaceId] = this.getDefaultPracticeData();
    } else {
      this.sessions[palaceId] = {
        ...this.getDefaultPracticeData(),
        ...this.sessions[palaceId],
      };
    }
    return this.sessions[palaceId];
  }

  /**
   * Record a practice session
   */
  recordPractice(palaceId, result, legacyStationScores = {}) {
    const data = this._ensurePracticeData(palaceId);
    const normalized =
      typeof result === 'number'
        ? {
            score: result,
            stationScores: legacyStationScores,
            totalQuestions: Object.keys(legacyStationScores).length,
            correctAnswers: Object.values(legacyStationScores).filter(Boolean).length,
            mode: 'quick-review',
          }
        : result || {};

    const score = Math.max(0, Math.min(100, Math.round(normalized.score || 0)));
    const stationScores = normalized.stationScores || {};
    const totalQuestions = normalized.totalQuestions || Object.keys(stationScores).length || 1;
    const correctAnswers =
      normalized.correctAnswers ?? Object.values(stationScores).filter(Boolean).length;
    const mode = normalized.mode || 'quiz';
    const practicedAt = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    const lastDate = data.lastPracticed ? data.lastPracticed.split('T')[0] : null;

    // Update streak
    if (lastDate) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastDate === today) {
        data.streak = Math.max(data.streak, 1);
      } else if (lastDate === yesterday) {
        data.streak += 1;
      } else {
        data.streak = 1;
      }
    } else {
      data.streak = 1;
    }

    // Update practice data
    data.lastPracticed = practicedAt;
    data.practiceCount++;
    data.mastery = Math.round(
      (data.mastery * (data.practiceCount - 1) + score) / data.practiceCount,
    );
    data.lastScore = score;
    data.bestScore = Math.max(data.bestScore || 0, score);

    // Update station progress
    Object.keys(stationScores).forEach((stationNum) => {
      if (!data.stationProgress[stationNum]) {
        data.stationProgress[stationNum] = { correct: 0, total: 0 };
      }
      data.stationProgress[stationNum].total++;
      if (stationScores[stationNum]) {
        data.stationProgress[stationNum].correct++;
      }
    });

    data.history.unshift({
      practicedAt,
      score,
      totalQuestions,
      correctAnswers,
      mode,
    });
    data.history = data.history.slice(0, 25);

    this.saveSessions();
    this.syncManager?.uploadSessions(this.sessions);
    return data;
  }

  /**
   * Get palaces due for practice (spaced repetition)
   */
  getDuePalaces(allPalaces) {
    const now = Date.now();
    return allPalaces
      .filter((palace) => {
        const data = this.getPracticeData(palace.id);
        if (!data.lastPracticed) return true; // Never practiced

        const daysSince = (now - new Date(data.lastPracticed)) / (1000 * 60 * 60 * 24);
        const interval = this.getInterval(data.practiceCount);
        return daysSince >= interval;
      })
      .sort((a, b) => {
        const aLast = this.getPracticeData(a.id).lastPracticed;
        const bLast = this.getPracticeData(b.id).lastPracticed;
        return new Date(aLast || 0) - new Date(bLast || 0);
      });
  }

  /**
   * Calculate spaced repetition interval
   */
  getInterval(practiceCount) {
    const intervals = [1, 3, 7, 14, 30, 60, 120];
    return intervals[Math.min(practiceCount, intervals.length - 1)];
  }

  /**
   * Get next review date
   */
  getNextReviewDate(palaceId) {
    const data = this.getPracticeData(palaceId);
    if (!data.lastPracticed) return 'Now';

    const interval = this.getInterval(data.practiceCount);
    const nextDate = new Date(new Date(data.lastPracticed).getTime() + interval * 86400000);
    const daysUntil = Math.ceil((nextDate - Date.now()) / 86400000);

    if (daysUntil <= 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    return `In ${daysUntil} days`;
  }

  /**
   * Get statistics for all palaces
   */
  getGlobalStats(allPalaces) {
    const stats = {
      totalPalaces: allPalaces.length,
      totalPracticed: 0,
      totalSessions: 0,
      averageStreak: 0,
      averageMastery: 0,
      dueToday: 0,
      bestStreak: 0,
      recentSessions: [],
      weakestPalaces: [],
      weeklyActivity: [],
    };

    allPalaces.forEach((palace) => {
      const data = this.getPracticeData(palace.id);
      if (data.practiceCount > 0) stats.totalPracticed++;
      stats.totalSessions += data.practiceCount;
      stats.averageStreak += data.streak;
      stats.averageMastery += data.mastery;
      stats.bestStreak = Math.max(stats.bestStreak, data.streak);
    });

    stats.dueToday = this.getDuePalaces(allPalaces).length;
    stats.averageStreak =
      allPalaces.length > 0 ? Math.round(stats.averageStreak / allPalaces.length) : 0;
    stats.averageMastery =
      allPalaces.length > 0 ? Math.round(stats.averageMastery / allPalaces.length) : 0;
    stats.weakestPalaces = this.getWeakestPalaces(allPalaces, 5);
    stats.recentSessions = this.getRecentSessions(allPalaces, 8);
    stats.weeklyActivity = this.getWeeklyActivity(allPalaces, 7);

    return stats;
  }

  getWeakestPalaces(allPalaces, limit = 5) {
    return allPalaces
      .map((palace) => ({
        palace,
        data: this.getPracticeData(palace.id),
      }))
      .filter(({ data }) => data.practiceCount > 0)
      .sort((a, b) => {
        if (a.data.mastery !== b.data.mastery) {
          return a.data.mastery - b.data.mastery;
        }
        return a.data.practiceCount - b.data.practiceCount;
      })
      .slice(0, limit)
      .map(({ palace, data }) => ({
        id: palace.id,
        name: palace.name,
        mastery: data.mastery,
        streak: data.streak,
        practiceCount: data.practiceCount,
      }));
  }

  getRecentSessions(allPalaces, limit = 8) {
    const palaceNames = new Map(allPalaces.map((palace) => [palace.id, palace.name]));

    return Object.entries(this.sessions)
      .flatMap(([palaceId, data]) =>
        (data.history || []).map((entry) => ({
          palaceId,
          palaceName: palaceNames.get(palaceId) || 'Unknown Palace',
          ...entry,
        })),
      )
      .sort((a, b) => new Date(b.practicedAt) - new Date(a.practicedAt))
      .slice(0, limit);
  }

  getWeeklyActivity(allPalaces, days = 7) {
    const recentSessions = this.getRecentSessions(allPalaces, 200);
    const buckets = Array.from({ length: days }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (days - index - 1));
      const key = date.toISOString().split('T')[0];
      return {
        key,
        label: date.toLocaleDateString(undefined, { weekday: 'short' }),
        sessions: 0,
      };
    });

    recentSessions.forEach((session) => {
      const key = session.practicedAt.split('T')[0];
      const bucket = buckets.find((item) => item.key === key);
      /* c8 ignore next 3 */
      if (bucket) {
        bucket.sessions += 1;
      }
    });

    return buckets;
  }
}
