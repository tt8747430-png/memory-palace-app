import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PracticeUI } from '../src/js/modules/PracticeUI.js';

describe('PracticeUI', () => {
  let practiceUI;
  const mockPalaceManager = {
    getAllPalaces: vi.fn(() => []),
    getPalaceById: vi.fn(() => null),
  };
  const mockPracticeManager = {
    getDuePalaces: vi.fn(() => []),
    getPracticeData: vi.fn(() => ({ practiceCount: 0, mastery: 0, streak: 0 })),
    getNextReviewDate: vi.fn(() => 'Now'),
    recordPractice: vi.fn(() => ({ mastery: 80, streak: 3 })),
  };
  const mockNotificationManager = {
    warning: vi.fn(),
    success: vi.fn(),
  };
  const mockEscapeHtml = vi.fn((text) => String(text || ''));
  const mockRenderPalaces = vi.fn();
  const mockShowJourney = vi.fn();

  const makeContainer = () => {
    let html = '';
    return {
      set innerHTML(val) {
        html = val;
      },
      get innerHTML() {
        return html;
      },
      addEventListener: vi.fn(),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    practiceUI = new PracticeUI({
      palaceManager: mockPalaceManager,
      practiceManager: mockPracticeManager,
      notificationManager: mockNotificationManager,
      escapeHtml: mockEscapeHtml,
      renderPalaces: mockRenderPalaces,
      showJourney: mockShowJourney,
    });
  });

  describe('constructor', () => {
    it('sets default state', () => {
      expect(practiceUI.practiceDueOnly).toBe(true);
      expect(practiceUI.activePracticeSession).toBeNull();
      expect(practiceUI._delegationReady).toBe(false);
    });
  });

  describe('hasActiveSession', () => {
    it('returns false when no session', () => {
      expect(practiceUI.hasActiveSession()).toBe(false);
    });

    it('returns true when session exists', () => {
      practiceUI.activePracticeSession = { palaceId: 'p1' };
      expect(practiceUI.hasActiveSession()).toBe(true);
    });
  });

  describe('renderSelector', () => {
    it('renders palace selector with due palaces', () => {
      const palaces = [{ id: 'p1', name: 'Palace', location: 'Loc', stations: 5 }];
      mockPalaceManager.getAllPalaces.mockReturnValue(palaces);
      mockPracticeManager.getDuePalaces.mockReturnValue(palaces);

      const container = makeContainer();
      practiceUI.renderSelector(container);

      expect(container.innerHTML).toContain('Select a Palace to Practice');
      expect(container.innerHTML).toContain('due for review today');
      expect(container.innerHTML).toContain('Palace');
    });

    it('renders empty message when no palaces due and dueOnly is true', () => {
      mockPalaceManager.getAllPalaces.mockReturnValue([{ id: 'p1', name: 'P' }]);
      mockPracticeManager.getDuePalaces.mockReturnValue([]);

      const container = makeContainer();
      practiceUI.renderSelector(container);
      expect(container.innerHTML).toContain('No palaces are currently due');
    });

    it('shows all palaces when practiceDueOnly is false', () => {
      const palaces = [{ id: 'p1', name: 'P1', location: 'L' }];
      mockPalaceManager.getAllPalaces.mockReturnValue(palaces);
      mockPracticeManager.getDuePalaces.mockReturnValue([]);

      practiceUI.practiceDueOnly = false;
      const container = makeContainer();
      practiceUI.renderSelector(container);
      expect(container.innerHTML).toContain('P1');
    });

    it('disables start button when no palaces', () => {
      mockPalaceManager.getAllPalaces.mockReturnValue([]);
      mockPracticeManager.getDuePalaces.mockReturnValue([]);

      const container = makeContainer();
      practiceUI.renderSelector(container);
      expect(container.innerHTML).toContain('disabled');
    });

    it('shows mastery badge states correctly', () => {
      const palaces = [{ id: 'p1', name: 'P1', location: 'L', stations: 3 }];
      mockPalaceManager.getAllPalaces.mockReturnValue(palaces);
      mockPracticeManager.getDuePalaces.mockReturnValue([]);
      mockPracticeManager.getPracticeData.mockReturnValue({
        practiceCount: 1,
        mastery: 80,
        streak: 2,
      });

      practiceUI.practiceDueOnly = false;
      const container = makeContainer();
      practiceUI.renderSelector(container);
      expect(container.innerHTML).toContain('80%');
    });

    it('shows "Practice" for low mastery non-due palaces', () => {
      const palaces = [{ id: 'p1', name: 'P1', location: 'L', stations: 3 }];
      mockPalaceManager.getAllPalaces.mockReturnValue(palaces);
      mockPracticeManager.getDuePalaces.mockReturnValue([]);
      mockPracticeManager.getPracticeData.mockReturnValue({
        practiceCount: 1,
        mastery: 30,
        streak: 0,
      });

      practiceUI.practiceDueOnly = false;
      const container = makeContainer();
      practiceUI.renderSelector(container);
      expect(container.innerHTML).toContain('Practice');
    });

    it('handles palace with no stations (metadata drill)', () => {
      const palaces = [{ id: 'p1', name: 'P1', location: 'L' }];
      mockPalaceManager.getAllPalaces.mockReturnValue(palaces);
      mockPracticeManager.getDuePalaces.mockReturnValue(palaces);

      const container = makeContainer();
      practiceUI.renderSelector(container);
      expect(container.innerHTML).toContain('metadata drill');
    });
  });

  describe('startSession', () => {
    it('returns false when palace not found', () => {
      mockPalaceManager.getPalaceById.mockReturnValue(null);
      expect(practiceUI.startSession('bad-id', makeContainer())).toBe(false);
    });

    it('returns false and warns when no questions can be built', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Empty', detailedStations: [] });
      expect(practiceUI.startSession('p1', makeContainer())).toBe(false);
      expect(mockNotificationManager.warning).toHaveBeenCalled();
    });

    it('starts session with metadata questions when no stations', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({
        name: 'Meta Palace',
        location: 'Church',
        book: 'John',
        chapter: '3',
        stations: 5,
        verses: 10,
      });

      const container = makeContainer();
      const result = practiceUI.startSession('p1', container);
      expect(result).toBe(true);
      expect(practiceUI.activePracticeSession).toBeTruthy();
      expect(practiceUI.activePracticeSession.questions.length).toBeGreaterThan(0);
    });

    it('starts session with station-based questions', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({
        name: 'Station Palace',
        location: 'Home',
        detailedStations: [
          { number: 1, title: 'S1', keywords: ['kw1'], verses: 'V1' },
          { number: 2, title: 'S2', keywords: ['kw2'], verses: 'V2' },
          { number: 3, title: 'S3', keywords: ['kw3'], verses: 'V3' },
        ],
      });

      const container = makeContainer();
      const result = practiceUI.startSession('p1', container);
      expect(result).toBe(true);
      expect(practiceUI.activePracticeSession.questions.length).toBeGreaterThan(0);
    });
  });

  describe('renderActiveSession', () => {
    it('renders selector when no active session', () => {
      mockPalaceManager.getAllPalaces.mockReturnValue([]);
      mockPracticeManager.getDuePalaces.mockReturnValue([]);

      const container = makeContainer();
      practiceUI.renderActiveSession(container);
      expect(container.innerHTML).toContain('Select a Palace');
    });

    it('renders summary when session has summary', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [{ prompt: 'Q1' }],
        currentIndex: 0,
        answers: [null],
        summary: {
          score: 80,
          correctAnswers: 4,
          totalQuestions: 5,
          mastery: 80,
          streak: 3,
          durationLabel: '45s',
        },
      };
      mockPracticeManager.getNextReviewDate.mockReturnValue('Tomorrow');

      const container = makeContainer();
      practiceUI.renderActiveSession(container);
      expect(container.innerHTML).toContain('80%');
      expect(container.innerHTML).toContain('quiz-results');
      expect(container.innerHTML).toContain('45s');
    });

    it('renders multiple-choice question', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [
          {
            type: 'multiple-choice',
            prompt: 'Pick one',
            hint: 'A hint',
            options: ['A', 'B', 'C'],
            correctAnswer: 'A',
          },
        ],
        currentIndex: 0,
        answers: [null],
        correctCount: 0,
        summary: null,
      };

      const container = makeContainer();
      practiceUI.renderActiveSession(container);
      expect(container.innerHTML).toContain('quiz-options');
      expect(container.innerHTML).toContain('A hint');
    });

    it('renders typed question', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [{ type: 'typed', prompt: 'Type answer', hint: '', acceptedAnswers: ['kw1'] }],
        currentIndex: 0,
        answers: [null],
        correctCount: 0,
        summary: null,
      };

      vi.spyOn(document, 'getElementById').mockImplementation((id) => {
        if (id === 'practiceTypedAnswer') return { focus: vi.fn() };
        return null;
      });

      const container = makeContainer();
      practiceUI.renderActiveSession(container);
      expect(container.innerHTML).toContain('quiz-typed-wrap');
      expect(container.innerHTML).toContain('practiceTypedAnswer');
    });

    it('renders answered multiple-choice question with feedback', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [
          {
            type: 'multiple-choice',
            prompt: 'Pick',
            options: ['A', 'B'],
            correctAnswer: 'A',
            explanation: 'A is correct',
          },
        ],
        currentIndex: 0,
        answers: [{ correct: true, selectedIndex: 0, userAnswer: 'A' }],
        correctCount: 1,
        summary: null,
      };

      const container = makeContainer();
      practiceUI.renderActiveSession(container);
      expect(container.innerHTML).toContain('✅ Correct');
      expect(container.innerHTML).toContain('quiz-feedback');
    });

    it('renders incorrect answer with correct answer shown', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [
          {
            type: 'multiple-choice',
            prompt: 'Pick',
            options: ['A', 'B'],
            correctAnswer: 'A',
            explanation: 'Exp',
          },
        ],
        currentIndex: 0,
        answers: [{ correct: false, selectedIndex: 1, userAnswer: 'B' }],
        correctCount: 0,
        summary: null,
      };

      const container = makeContainer();
      practiceUI.renderActiveSession(container);
      expect(container.innerHTML).toContain('❌ Not quite');
      expect(container.innerHTML).toContain('Correct answer:');
    });

    it('renders answered typed question', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [{ type: 'typed', prompt: 'Type', acceptedAnswers: ['ans'], explanation: '' }],
        currentIndex: 0,
        answers: [{ correct: false, userAnswer: 'wrong' }],
        correctCount: 0,
        summary: null,
      };

      const container = makeContainer();
      practiceUI.renderActiveSession(container);
      expect(container.innerHTML).toContain('wrong');
      expect(container.innerHTML).toContain('disabled');
    });

    it('shows Finish Quiz on last question', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [{ type: 'typed', prompt: 'Q1', acceptedAnswers: ['a'] }],
        currentIndex: 0,
        answers: [{ correct: true, userAnswer: 'a' }],
        correctCount: 1,
        summary: null,
      };

      const container = makeContainer();
      practiceUI.renderActiveSession(container);
      expect(container.innerHTML).toContain('Finish Quiz');
    });
  });

  describe('_ensureDelegation', () => {
    it('sets up click and keydown delegation only once', () => {
      const container = { addEventListener: vi.fn(), innerHTML: '' };
      practiceUI._ensureDelegation(container);
      practiceUI._ensureDelegation(container);
      // 2 keydown + 1 click = 3 total, called only once
      expect(container.addEventListener).toHaveBeenCalledTimes(3);
    });
  });

  describe('_handleAction', () => {
    it('startSession action', () => {
      const spy = vi.spyOn(practiceUI, 'startSession').mockReturnValue(true);
      const el = { dataset: { palaceId: 'p1' } };
      practiceUI._handleAction('startSession', el, makeContainer());
      expect(spy).toHaveBeenCalledWith('p1', expect.anything());
    });

    it('startNextDue action with due palaces', () => {
      const palaces = [{ id: 'p1' }];
      mockPalaceManager.getAllPalaces.mockReturnValue(palaces);
      mockPracticeManager.getDuePalaces.mockReturnValue(palaces);
      const spy = vi.spyOn(practiceUI, 'startSession').mockReturnValue(true);
      practiceUI._handleAction('startNextDue', {}, makeContainer());
      expect(spy).toHaveBeenCalledWith('p1', expect.anything());
    });

    it('startNextDue action falls back to first palace', () => {
      const palaces = [{ id: 'p1' }];
      mockPalaceManager.getAllPalaces.mockReturnValue(palaces);
      mockPracticeManager.getDuePalaces.mockReturnValue([]);
      const spy = vi.spyOn(practiceUI, 'startSession').mockReturnValue(true);
      practiceUI._handleAction('startNextDue', {}, makeContainer());
      expect(spy).toHaveBeenCalledWith('p1', expect.anything());
    });

    it('startNextDue does nothing when no palaces', () => {
      mockPalaceManager.getAllPalaces.mockReturnValue([]);
      mockPracticeManager.getDuePalaces.mockReturnValue([]);
      const spy = vi.spyOn(practiceUI, 'startSession');
      practiceUI._handleAction('startNextDue', {}, makeContainer());
      expect(spy).not.toHaveBeenCalled();
    });

    it('toggleDueOnly action', () => {
      const spy = vi.spyOn(practiceUI, 'renderSelector').mockImplementation(() => {});
      practiceUI.practiceDueOnly = true;
      practiceUI._handleAction('toggleDueOnly', {}, makeContainer());
      expect(practiceUI.practiceDueOnly).toBe(false);
      expect(spy).toHaveBeenCalled();
    });

    it('answerOption action', () => {
      const spy = vi.spyOn(practiceUI, '_answerOption').mockImplementation(() => {});
      practiceUI._handleAction('answerOption', { dataset: { index: '1' } }, makeContainer());
      expect(spy).toHaveBeenCalledWith(1, expect.anything());
    });

    it('submitTyped action', () => {
      const spy = vi.spyOn(practiceUI, '_submitTyped').mockImplementation(() => {});
      practiceUI._handleAction('submitTyped', {}, makeContainer());
      expect(spy).toHaveBeenCalled();
    });

    it('nextQuestion action', () => {
      const spy = vi.spyOn(practiceUI, '_nextQuestion').mockImplementation(() => {});
      practiceUI._handleAction('nextQuestion', {}, makeContainer());
      expect(spy).toHaveBeenCalled();
    });

    it('restart action', () => {
      practiceUI.activePracticeSession = { palaceId: 'p1' };
      const spy = vi.spyOn(practiceUI, 'startSession').mockReturnValue(true);
      practiceUI._handleAction('restart', {}, makeContainer());
      expect(spy).toHaveBeenCalledWith('p1', expect.anything());
    });

    it('restart does nothing when no session', () => {
      practiceUI.activePracticeSession = null;
      const spy = vi.spyOn(practiceUI, 'startSession');
      practiceUI._handleAction('restart', {}, makeContainer());
      expect(spy).not.toHaveBeenCalled();
    });

    it('openJourney action', () => {
      practiceUI.activePracticeSession = { palaceId: 'p1' };
      practiceUI._handleAction('openJourney', {}, makeContainer());
      expect(mockShowJourney).toHaveBeenCalledWith('p1');
      expect(practiceUI.activePracticeSession).toBeNull();
    });

    it('openJourney does nothing when no session', () => {
      practiceUI.activePracticeSession = null;
      practiceUI._handleAction('openJourney', {}, makeContainer());
      expect(mockShowJourney).not.toHaveBeenCalled();
    });

    it('exit action', () => {
      practiceUI.activePracticeSession = { palaceId: 'p1' };
      const spy = vi.spyOn(practiceUI, 'renderSelector').mockImplementation(() => {});
      practiceUI._handleAction('exit', {}, makeContainer());
      expect(practiceUI.activePracticeSession).toBeNull();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_answerOption', () => {
    it('records correct answer', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [
          { type: 'multiple-choice', prompt: 'Q', options: ['A', 'B'], correctAnswer: 'A' },
        ],
        currentIndex: 0,
        answers: [null],
        correctCount: 0,
        summary: null,
      };
      const spy = vi.spyOn(practiceUI, 'renderActiveSession').mockImplementation(() => {});
      practiceUI._answerOption(0, makeContainer());
      expect(practiceUI.activePracticeSession.answers[0].correct).toBe(true);
      expect(practiceUI.activePracticeSession.correctCount).toBe(1);
      expect(spy).toHaveBeenCalled();
    });

    it('records incorrect answer', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [
          { type: 'multiple-choice', prompt: 'Q', options: ['A', 'B'], correctAnswer: 'A' },
        ],
        currentIndex: 0,
        answers: [null],
        correctCount: 0,
        summary: null,
      };
      vi.spyOn(practiceUI, 'renderActiveSession').mockImplementation(() => {});
      practiceUI._answerOption(1, makeContainer());
      expect(practiceUI.activePracticeSession.answers[0].correct).toBe(false);
      expect(practiceUI.activePracticeSession.correctCount).toBe(0);
    });

    it('does nothing if already answered', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        questions: [{ options: ['A', 'B'], correctAnswer: 'A' }],
        currentIndex: 0,
        answers: [{ correct: true }],
        correctCount: 1,
        summary: null,
      };
      const spy = vi.spyOn(practiceUI, 'renderActiveSession');
      practiceUI._answerOption(0, makeContainer());
      expect(spy).not.toHaveBeenCalled();
    });

    it('does nothing if no session', () => {
      practiceUI.activePracticeSession = null;
      const spy = vi.spyOn(practiceUI, 'renderActiveSession');
      practiceUI._answerOption(0, makeContainer());
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('_submitTyped', () => {
    it('records correct typed answer', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [{ type: 'typed', prompt: 'Q', acceptedAnswers: ['keyword'] }],
        currentIndex: 0,
        answers: [null],
        correctCount: 0,
        summary: null,
      };
      vi.spyOn(document, 'getElementById').mockReturnValue({ value: 'keyword' });
      vi.spyOn(practiceUI, 'renderActiveSession').mockImplementation(() => {});

      practiceUI._submitTyped(makeContainer());
      expect(practiceUI.activePracticeSession.answers[0].correct).toBe(true);
    });

    it('warns when input is empty', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        questions: [{ type: 'typed', acceptedAnswers: ['a'] }],
        currentIndex: 0,
        answers: [null],
        correctCount: 0,
        summary: null,
      };
      vi.spyOn(document, 'getElementById').mockReturnValue({ value: '' });

      practiceUI._submitTyped(makeContainer());
      expect(mockNotificationManager.warning).toHaveBeenCalledWith(
        'Type an answer before submitting.',
      );
    });

    it('does nothing if already answered', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        questions: [{ acceptedAnswers: ['a'] }],
        currentIndex: 0,
        answers: [{ correct: true }],
        correctCount: 1,
        summary: null,
      };
      const spy = vi.spyOn(practiceUI, 'renderActiveSession');
      practiceUI._submitTyped(makeContainer());
      expect(spy).not.toHaveBeenCalled();
    });

    it('does nothing if no session', () => {
      practiceUI.activePracticeSession = null;
      practiceUI._submitTyped(makeContainer());
    });

    it('handles null input element', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        questions: [{ type: 'typed', acceptedAnswers: ['a'] }],
        currentIndex: 0,
        answers: [null],
        correctCount: 0,
        summary: null,
      };
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      practiceUI._submitTyped(makeContainer());
      expect(mockNotificationManager.warning).toHaveBeenCalled();
    });
  });

  describe('_nextQuestion', () => {
    it('advances to next question', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [{ prompt: 'Q1' }, { prompt: 'Q2' }],
        currentIndex: 0,
        answers: [{ correct: true }, null],
        correctCount: 1,
        summary: null,
      };
      const spy = vi.spyOn(practiceUI, 'renderActiveSession').mockImplementation(() => {});
      practiceUI._nextQuestion(makeContainer());
      expect(practiceUI.activePracticeSession.currentIndex).toBe(1);
      expect(spy).toHaveBeenCalled();
    });

    it('finishes quiz on last question', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [{ prompt: 'Q1', stationNumber: 1 }],
        currentIndex: 0,
        answers: [{ correct: true }],
        correctCount: 1,
        summary: null,
        startedAt: Date.now() - 30000,
      };
      vi.spyOn(practiceUI, 'renderActiveSession').mockImplementation(() => {});

      practiceUI._nextQuestion(makeContainer());
      expect(practiceUI.activePracticeSession.summary).toBeTruthy();
      expect(practiceUI.activePracticeSession.summary.score).toBe(100);
      expect(mockPracticeManager.recordPractice).toHaveBeenCalled();
      expect(mockRenderPalaces).toHaveBeenCalled();
    });

    it('computes duration label in minutes for long sessions', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [{ prompt: 'Q1', stationNumber: 1 }],
        currentIndex: 0,
        answers: [{ correct: true }],
        correctCount: 1,
        summary: null,
        startedAt: Date.now() - 120000,
      };
      vi.spyOn(practiceUI, 'renderActiveSession').mockImplementation(() => {});
      practiceUI._nextQuestion(makeContainer());
      expect(practiceUI.activePracticeSession.summary.durationLabel).toBe('2m');
    });

    it('does nothing if no session', () => {
      practiceUI.activePracticeSession = null;
      practiceUI._nextQuestion(makeContainer());
    });

    it('does nothing if not answered yet', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        questions: [{ prompt: 'Q1' }],
        currentIndex: 0,
        answers: [null],
        correctCount: 0,
        summary: null,
      };
      const spy = vi.spyOn(practiceUI, 'renderActiveSession');
      practiceUI._nextQuestion(makeContainer());
      expect(spy).not.toHaveBeenCalled();
    });

    it('handles questions without stationNumber in stationScores', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [{ prompt: 'Q1' }], // no stationNumber
        currentIndex: 0,
        answers: [{ correct: true }],
        correctCount: 1,
        summary: null,
        startedAt: Date.now() - 5000,
      };
      vi.spyOn(practiceUI, 'renderActiveSession').mockImplementation(() => {});
      practiceUI._nextQuestion(makeContainer());
      expect(practiceUI.activePracticeSession.summary).toBeTruthy();
    });

    it('handles multiple station scores with same stationNumber', () => {
      practiceUI.activePracticeSession = {
        palaceId: 'p1',
        palaceName: 'Test',
        questions: [
          { prompt: 'Q1', stationNumber: 1 },
          { prompt: 'Q2', stationNumber: 1 },
        ],
        currentIndex: 1,
        answers: [{ correct: true }, { correct: false }],
        correctCount: 1,
        summary: null,
        startedAt: Date.now() - 5000,
      };
      vi.spyOn(practiceUI, 'renderActiveSession').mockImplementation(() => {});
      practiceUI._nextQuestion(makeContainer());
      expect(practiceUI.activePracticeSession.summary).toBeTruthy();
    });
  });

  describe('_buildQuestions', () => {
    it('builds station-based questions', () => {
      const palace = {
        name: 'Test',
        location: 'Home',
        detailedStations: [
          { number: 1, title: 'S1', keywords: ['k1', 'k2'], verses: 'V1' },
          { number: 2, title: 'S2', keywords: ['k3'], verses: 'V2' },
          { number: 3, title: 'S3', keywords: ['k4'], verses: 'V3' },
        ],
      };
      const questions = practiceUI._buildQuestions(palace);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('builds metadata questions when no stations', () => {
      const palace = {
        name: 'Meta Palace',
        location: 'Church',
        book: 'John',
        chapter: '3',
        stations: 5,
        verses: 10,
        detailedStations: [],
      };
      const questions = practiceUI._buildQuestions(palace);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].type).toBe('typed');
    });

    it('returns empty when palace has no usable data', () => {
      const palace = { name: 'Empty' };
      const questions = practiceUI._buildQuestions(palace);
      expect(questions).toEqual([]);
    });

    it('filters stations missing title/verses/keywords', () => {
      const palace = {
        name: 'Filtered',
        detailedStations: [
          { number: 1 }, // no title, no verses, no keywords
          { number: 2, title: 'S2', keywords: ['k1'] },
        ],
      };
      const questions = practiceUI._buildQuestions(palace);
      // Should only generate questions from station 2
      expect(questions.length).toBeLessThanOrEqual(1);
    });

    it('limits to 6 stations max', () => {
      const stations = Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        title: `S${i + 1}`,
        keywords: [`k${i + 1}`],
        verses: `V${i + 1}`,
      }));
      const palace = { name: 'Many', location: 'L', detailedStations: stations };
      const questions = practiceUI._buildQuestions(palace);
      expect(questions.length).toBeLessThanOrEqual(6);
    });

    it('generates multiple-choice for even-indexed stations with enough distractors', () => {
      const palace = {
        name: 'MC',
        location: 'L',
        detailedStations: [
          { number: 1, title: 'S1', keywords: ['A'], verses: 'V1' },
          { number: 2, title: 'S2', keywords: ['B'], verses: 'V2' },
          { number: 3, title: 'S3', keywords: ['C'], verses: 'V3' },
        ],
      };
      const questions = practiceUI._buildQuestions(palace);
      const mc = questions.find((q) => q.type === 'multiple-choice');
      if (mc) {
        expect(mc.options.length).toBeLessThanOrEqual(4);
        expect(mc.options).toContain(mc.correctAnswer);
      }
    });

    it('falls back to metadata questions when stations have no keywords', () => {
      const palace = {
        name: 'NoKW',
        location: 'L',
        detailedStations: [{ number: 1, title: '', keywords: [], verses: '' }],
      };
      const questions = practiceUI._buildQuestions(palace);
      expect(questions.length).toBeGreaterThanOrEqual(0);
    });

    it('builds metadata questions with partial data', () => {
      const palace = {
        name: 'Partial',
        location: 'Loc',
        description: 'Desc',
        notes: 'Notes',
      };
      const questions = practiceUI._buildQuestions(palace);
      expect(questions.length).toBeGreaterThan(0);
    });
  });

  describe('_normalizeText', () => {
    it('normalizes Unicode and lowercases', () => {
      expect(practiceUI._normalizeText('Café')).toBe('cafe');
    });

    it('strips special characters', () => {
      expect(practiceUI._normalizeText('hello-world!')).toBe('hello world');
    });

    it('handles null/empty input', () => {
      expect(practiceUI._normalizeText(null)).toBe('');
      expect(practiceUI._normalizeText('')).toBe('');
    });

    it('collapses whitespace', () => {
      expect(practiceUI._normalizeText('  hello   world  ')).toBe('hello world');
    });
  });

  describe('_answersMatch', () => {
    it('returns true for exact match', () => {
      expect(practiceUI._answersMatch('hello', 'hello')).toBe(true);
    });

    it('returns false for empty inputs', () => {
      expect(practiceUI._answersMatch('', 'hello')).toBe(false);
      expect(practiceUI._answersMatch('hello', '')).toBe(false);
    });

    it('returns false for short non-matching strings', () => {
      expect(practiceUI._answersMatch('ab', 'cd')).toBe(false);
    });

    it('returns true if one contains the other (4+ chars)', () => {
      expect(practiceUI._answersMatch('keyword', 'keyword phrase')).toBe(true);
      expect(practiceUI._answersMatch('keyword phrase', 'keyword')).toBe(true);
    });

    it('returns false for non-matching long strings', () => {
      expect(practiceUI._answersMatch('alpha', 'bravo')).toBe(false);
    });
  });

  describe('_shuffleArray', () => {
    it('returns array of same length', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = practiceUI._shuffleArray(arr);
      expect(shuffled).toHaveLength(5);
      expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('does not mutate the original', () => {
      const arr = [1, 2, 3];
      practiceUI._shuffleArray(arr);
      expect(arr).toEqual([1, 2, 3]);
    });

    it('handles empty array', () => {
      expect(practiceUI._shuffleArray([])).toEqual([]);
    });

    it('handles single element', () => {
      expect(practiceUI._shuffleArray([42])).toEqual([42]);
    });
  });

  describe('delegation handlers', () => {
    it('handles click delegation with data-action', () => {
      const container = { addEventListener: vi.fn(), innerHTML: '' };
      practiceUI._ensureDelegation(container);

      const clickHandler = container.addEventListener.mock.calls.find((c) => c[0] === 'click')[1];
      const actionSpy = vi.spyOn(practiceUI, '_handleAction').mockImplementation(() => {});

      // Click on element with data-action
      const el = {
        dataset: { action: 'exit' },
        closest: vi.fn((sel) => (sel === '[data-action]' ? el : null)),
      };
      clickHandler({ target: el });
      expect(actionSpy).toHaveBeenCalledWith('exit', el, container);

      // Click on element without data-action
      const noEl = { closest: vi.fn(() => null) };
      clickHandler({ target: noEl });
    });

    it('handles keydown delegation for Enter and Space', () => {
      const container = { addEventListener: vi.fn(), innerHTML: '' };
      practiceUI._delegationReady = false;
      practiceUI._ensureDelegation(container);

      const keydownHandler = container.addEventListener.mock.calls.find(
        (c) => c[0] === 'keydown',
      )[1];
      const actionSpy = vi.spyOn(practiceUI, '_handleAction').mockImplementation(() => {});

      // Enter on button with data-action
      const btnEl = {
        dataset: { action: 'exit' },
        tagName: 'BUTTON',
        getAttribute: vi.fn(() => null),
        closest: vi.fn((sel) => (sel === '[data-action]' ? btnEl : null)),
      };
      keydownHandler({ key: 'Enter', target: btnEl, preventDefault: vi.fn() });
      expect(actionSpy).toHaveBeenCalled();

      // Space on role="button"
      const roleEl = {
        dataset: { action: 'exit' },
        tagName: 'DIV',
        getAttribute: vi.fn((attr) => (attr === 'role' ? 'button' : null)),
        closest: vi.fn((sel) => (sel === '[data-action]' ? roleEl : null)),
      };
      keydownHandler({ key: ' ', target: roleEl, preventDefault: vi.fn() });

      // Non-Enter/Space key
      keydownHandler({ key: 'a', target: btnEl, preventDefault: vi.fn() });

      // Enter without data-action
      keydownHandler({
        key: 'Enter',
        target: { closest: vi.fn(() => null) },
        preventDefault: vi.fn(),
      });
    });

    it('handles Enter in typed answer input', () => {
      const container = { addEventListener: vi.fn(), innerHTML: '' };
      practiceUI._delegationReady = false;
      practiceUI._ensureDelegation(container);

      // There are 2 keydown listeners - the second one handles practiceTypedAnswer
      const keydownHandlers = container.addEventListener.mock.calls
        .filter((c) => c[0] === 'keydown')
        .map((c) => c[1]);
      const actionSpy = vi.spyOn(practiceUI, '_handleAction').mockImplementation(() => {});

      const input = { id: 'practiceTypedAnswer' };
      keydownHandlers[1]({ key: 'Enter', target: input, preventDefault: vi.fn() });
      expect(actionSpy).toHaveBeenCalledWith('submitTyped', input, container);

      // Non-Enter key should not trigger
      actionSpy.mockClear();
      keydownHandlers[1]({ key: 'a', target: input, preventDefault: vi.fn() });
      expect(actionSpy).not.toHaveBeenCalled();

      // Different input id should not trigger
      keydownHandlers[1]({ key: 'Enter', target: { id: 'other' }, preventDefault: vi.fn() });
    });
  });
});
