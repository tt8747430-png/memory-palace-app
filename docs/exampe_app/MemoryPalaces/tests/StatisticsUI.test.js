import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from '../src/js/modules/Logger.js';
import { StatisticsUI } from '../src/js/modules/StatisticsUI.js';

describe('StatisticsUI', () => {
  let statsUI;
  const mockPalaceManager = {
    getAllPalaces: vi.fn(() => []),
  };
  const mockPracticeManager = {
    getPracticeData: vi.fn(() => ({ practiceCount: 0, mastery: 0, streak: 0 })),
    getGlobalStats: vi.fn(() => ({
      totalPalaces: 2,
      totalPracticed: 1,
      dueToday: 1,
      totalSessions: 5,
      averageStreak: 3,
      averageMastery: 75,
      bestStreak: 5,
      weakestPalaces: [],
      recentSessions: [],
      weeklyActivity: [
        { label: 'Mon', sessions: 2 },
        { label: 'Tue', sessions: 0 },
        { label: 'Wed', sessions: 1 },
      ],
    })),
    getNextReviewDate: vi.fn(() => 'Tomorrow'),
  };
  const mockNotificationManager = {
    error: vi.fn(),
  };
  const mockEscapeHtml = vi.fn((text) => String(text || ''));
  const mockFormatRelativeTime = vi.fn(() => '2 min ago');

  beforeEach(() => {
    vi.clearAllMocks();
    Logger.clearRing();
    statsUI = new StatisticsUI({
      palaceManager: mockPalaceManager,
      practiceManager: mockPracticeManager,
      notificationManager: mockNotificationManager,
      escapeHtml: mockEscapeHtml,
      formatRelativeTime: mockFormatRelativeTime,
    });
    // Reset delegation flag
    statsUI._delegationBound = false;
  });

  describe('render', () => {
    it('shows error when practiceManager is missing', () => {
      const brokenUI = new StatisticsUI({
        palaceManager: mockPalaceManager,
        practiceManager: null,
        notificationManager: mockNotificationManager,
        escapeHtml: mockEscapeHtml,
        formatRelativeTime: mockFormatRelativeTime,
      });
      const container = { innerHTML: '', addEventListener: vi.fn() };
      brokenUI.render(container);
      expect(mockNotificationManager.error).toHaveBeenCalledWith(
        'Practice manager not initialized',
      );
    });

    it('renders statistics grid with global stats', () => {
      const container = { innerHTML: '', addEventListener: vi.fn() };
      statsUI.render(container);

      expect(container.innerHTML).toContain('2'); // totalPalaces
      expect(container.innerHTML).toContain('75%'); // averageMastery
      expect(container.innerHTML).toContain('stat-card');
    });

    it('renders weekly activity chart', () => {
      const container = { innerHTML: '', addEventListener: vi.fn() };
      statsUI.render(container);

      expect(container.innerHTML).toContain('weekly-trend');
      expect(container.innerHTML).toContain('Mon');
    });

    it('renders weakest palaces when available', () => {
      mockPracticeManager.getGlobalStats.mockReturnValueOnce({
        totalPalaces: 1,
        totalPracticed: 1,
        dueToday: 0,
        totalSessions: 3,
        averageStreak: 1,
        averageMastery: 40,
        bestStreak: 1,
        weakestPalaces: [{ name: 'Weak Palace', mastery: 30, streak: 1, practiceCount: 2 }],
        recentSessions: [],
        weeklyActivity: [{ label: 'Mon', sessions: 1 }],
      });

      const container = { innerHTML: '', addEventListener: vi.fn() };
      statsUI.render(container);
      expect(container.innerHTML).toContain('Weak Palace');
      expect(container.innerHTML).toContain('30%');
    });

    it('shows empty message when no weakest palaces', () => {
      const container = { innerHTML: '', addEventListener: vi.fn() };
      statsUI.render(container);
      expect(container.innerHTML).toContain('Start a practice session');
    });

    it('renders recent sessions when available', () => {
      mockPracticeManager.getGlobalStats.mockReturnValueOnce({
        totalPalaces: 1,
        totalPracticed: 1,
        dueToday: 0,
        totalSessions: 1,
        averageStreak: 1,
        averageMastery: 80,
        bestStreak: 1,
        weakestPalaces: [],
        recentSessions: [
          {
            palaceName: 'Test',
            mode: 'quiz',
            correctAnswers: 3,
            totalQuestions: 4,
            score: 75,
            practicedAt: '2026-01-01',
          },
        ],
        weeklyActivity: [{ label: 'Mon', sessions: 1 }],
      });

      const container = { innerHTML: '', addEventListener: vi.fn() };
      statsUI.render(container);
      expect(container.innerHTML).toContain('Test');
      expect(container.innerHTML).toContain('75%');
    });

    it('shows empty message when no recent sessions', () => {
      const container = { innerHTML: '', addEventListener: vi.fn() };
      statsUI.render(container);
      expect(container.innerHTML).toContain('No practice history yet');
    });

    it('renders palace details for each palace', () => {
      mockPalaceManager.getAllPalaces.mockReturnValueOnce([
        { id: 'p1', name: 'Palace One' },
        { id: 'p2', name: 'Palace Two' },
      ]);

      const container = { innerHTML: '', addEventListener: vi.fn() };
      statsUI.render(container);
      expect(mockEscapeHtml).toHaveBeenCalledWith('Palace One');
      expect(mockEscapeHtml).toHaveBeenCalledWith('Palace Two');
    });

    it('renders error section when Logger has recent errors', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      Logger.error('Test error');

      const container = { innerHTML: '', addEventListener: vi.fn() };
      statsUI.render(container);
      expect(container.innerHTML).toContain('Recent Warnings');
      expect(container.innerHTML).toContain('Test error');
      expect(container.innerHTML).toContain('data-action="downloadLogs"');

      vi.restoreAllMocks();
    });

    it('does not render error section when no recent errors', () => {
      const container = { innerHTML: '', addEventListener: vi.fn() };
      statsUI.render(container);
      expect(container.innerHTML).not.toContain('Recent Warnings');
    });

    it('binds download delegation only once', () => {
      const container = { innerHTML: '', addEventListener: vi.fn() };
      statsUI.render(container);
      statsUI.render(container);
      // addEventListener should be called only once for the delegation
      expect(container.addEventListener).toHaveBeenCalledTimes(1);
    });

    it('download button delegation calls Logger.downloadLogs', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      Logger.error('err');

      const clickHandlers = [];
      const container = {
        innerHTML: '',
        addEventListener: vi.fn((_, handler) => clickHandlers.push(handler)),
      };
      statsUI.render(container);

      const downloadSpy = vi.spyOn(Logger, 'downloadLogs').mockImplementation(() => {});
      const btn = {
        closest: vi.fn((sel) => (sel === '[data-action="downloadLogs"]' ? btn : null)),
      };
      clickHandlers[0]({ target: btn });
      expect(downloadSpy).toHaveBeenCalled();

      // Non-matching click
      const other = { closest: vi.fn(() => null) };
      clickHandlers[0]({ target: other });

      vi.restoreAllMocks();
    });

    it('renders recent sessions with high score badge', () => {
      mockPracticeManager.getGlobalStats.mockReturnValueOnce({
        totalPalaces: 1,
        totalPracticed: 1,
        dueToday: 0,
        totalSessions: 1,
        averageStreak: 1,
        averageMastery: 80,
        bestStreak: 1,
        weakestPalaces: [],
        recentSessions: [
          {
            palaceName: 'High',
            mode: 'quiz',
            correctAnswers: 4,
            totalQuestions: 4,
            score: 95,
            practicedAt: '2026-01-01',
          },
        ],
        weeklyActivity: [{ label: 'Mon', sessions: 1 }],
      });

      const container = { innerHTML: '', addEventListener: vi.fn() };
      statsUI.render(container);
      expect(container.innerHTML).toContain('upcoming');
    });
  });
});
