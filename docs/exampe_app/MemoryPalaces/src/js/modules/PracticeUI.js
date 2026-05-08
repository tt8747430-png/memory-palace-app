/**
 * PracticeUI — Practice quiz session UI.
 * Extracted from UIController for modularity and lazy-loadability (Guide §2.1, §5.5).
 * Uses data-action event delegation instead of window.* globals (preferred pattern).
 */
export class PracticeUI {
  /**
   * @param {object} deps
   * @param {import('./PalaceManager.js').PalaceManager} deps.palaceManager
   * @param {import('./PracticeManager.js').PracticeManager} deps.practiceManager
   * @param {import('./NotificationManager.js').NotificationManager} deps.notificationManager
   * @param {function(string): string} deps.escapeHtml
   * @param {function(): void} deps.renderPalaces — refresh the palace grid
   * @param {function(string): void} deps.showJourney — open journey for a palace
   */
  constructor({
    palaceManager,
    practiceManager,
    notificationManager,
    escapeHtml,
    renderPalaces,
    showJourney,
  }) {
    this.palaceManager = palaceManager;
    this.practiceManager = practiceManager;
    this.notificationManager = notificationManager;
    this.escapeHtml = escapeHtml;
    this._renderPalaces = renderPalaces;
    this._showJourney = showJourney;

    this.practiceDueOnly = true;
    this.activePracticeSession = null;
    this._delegationReady = false;
  }

  /** @returns {boolean} true if a quiz session is in progress */
  hasActiveSession() {
    return !!this.activePracticeSession;
  }

  // ── Palace selector ──────────────────────────────────────────────────

  /**
   * Render the palace practice selector into the container.
   * @param {HTMLElement} container
   */
  renderSelector(container) {
    this._ensureDelegation(container);

    const palaces = this.palaceManager.getAllPalaces();
    const duePalaces = this.practiceManager.getDuePalaces(palaces);
    const listToRender = this.practiceDueOnly ? duePalaces : palaces;

    container.innerHTML = `
      <div class="practice-selector">
        <h3 style="margin-bottom: 1rem;">Select a Palace to Practice</h3>
        ${
          duePalaces.length > 0
            ? `<p class="practice-due-alert">⚠️ ${duePalaces.length} palace(s) due for review today!</p>`
            : ''
        }
        <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <button class="btn btn-primary btn-small" data-action="startNextDue" ${palaces.length === 0 ? 'disabled' : ''}>
            ⏭️ Practice Next Due
          </button>
          <button class="btn btn-secondary btn-small" data-action="toggleDueOnly">
            ${this.practiceDueOnly ? '👁️ Show All Palaces' : '🎯 Show Due Only'}
          </button>
        </div>
        <div class="practice-palace-list">
          ${
            listToRender.length === 0
              ? '<div class="practice-empty-message">No palaces are currently due. Switch to all palaces to do bonus practice.</div>'
              : listToRender
                  .map((p) => {
                    const data = this.practiceManager.getPracticeData(p.id);
                    const nextReview = this.practiceManager.getNextReviewDate(p.id);
                    const isDue = duePalaces.some((dp) => dp.id === p.id);
                    return `
              <div class="practice-palace-item" data-action="startSession" data-palace-id="${p.id}"
                   role="button" tabindex="0">
                <div class="practice-info">
                  <div class="practice-title">${this.escapeHtml(p.name)}</div>
                  <div class="practice-meta">
                    📍 ${this.escapeHtml(p.location)} •
                    ${p.stations ? `🗺️ ${p.stations} stations` : '🧩 metadata drill'} •
                    📅 Next review: ${nextReview}
                  </div>
                </div>
                <div class="practice-badge ${isDue ? 'due' : data.mastery > 70 ? 'upcoming' : ''}">
                  ${isDue ? 'Due Now' : data.mastery > 70 ? `${data.mastery}%` : 'Practice'}
                </div>
              </div>`;
                  })
                  .join('')
          }
        </div>
      </div>`;
  }

  // ── Quiz session ─────────────────────────────────────────────────────

  /**
   * Start a quiz session for a palace.
   * @param {string} palaceId
   * @param {HTMLElement} container
   * @returns {boolean} true if session started
   */
  startSession(palaceId, container) {
    const palace = this.palaceManager.getPalaceById(palaceId);
    if (!palace) return false;

    const questions = this._buildQuestions(palace);
    if (questions.length === 0) {
      this.notificationManager?.warning(
        'Add some station details or metadata before starting a quiz.',
      );
      return false;
    }

    this.activePracticeSession = {
      palaceId,
      palaceName: palace.name,
      questions,
      currentIndex: 0,
      answers: Array(questions.length).fill(null),
      correctCount: 0,
      startedAt: Date.now(),
      summary: null,
    };

    this._ensureDelegation(container);
    this.renderActiveSession(container);
    return true;
  }

  /**
   * Render the current quiz question or results summary.
   * @param {HTMLElement} container
   */
  renderActiveSession(container) {
    const session = this.activePracticeSession;
    if (!session) {
      this.renderSelector(container);
      return;
    }

    if (session.summary) {
      container.innerHTML = `
        <div class="quiz-results">
          <div class="quiz-score">${session.summary.score}%</div>
          <h3>${this.escapeHtml(session.palaceName)}</h3>
          <p class="practice-summary-meta">
            ${session.summary.correctAnswers}/${session.summary.totalQuestions} correct • Next review: ${this.practiceManager.getNextReviewDate(session.palaceId)}
          </p>
          <div class="stats-grid" style="margin-bottom: 1.5rem;">
            <div class="stat-card"><div class="stat-value">${session.summary.mastery}%</div><div class="stat-label">New Mastery</div></div>
            <div class="stat-card secondary"><div class="stat-value">${session.summary.streak}</div><div class="stat-label">Current Streak</div></div>
            <div class="stat-card success"><div class="stat-value">${session.summary.durationLabel}</div><div class="stat-label">Session Time</div></div>
          </div>
          <div class="quiz-actions">
            <button class="btn btn-primary" data-action="restart">🔁 Practice Again</button>
            <button class="btn btn-secondary" data-action="openJourney">🗺️ Open Journey</button>
            <button class="btn btn-secondary" data-action="exit">← Back to List</button>
          </div>
        </div>`;
      return;
    }

    const question = session.questions[session.currentIndex];
    const answer = session.answers[session.currentIndex];
    const progress = Math.round((session.currentIndex / session.questions.length) * 100);

    container.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-progress"><div class="quiz-progress-bar" style="width: ${progress}%"></div></div>
        <div class="practice-meta" style="margin-bottom: 0.75rem;">${this.escapeHtml(session.palaceName)} • Question ${session.currentIndex + 1} of ${session.questions.length}</div>
        <div class="quiz-question">
          <h3>${this.escapeHtml(question.prompt)}</h3>
          ${question.hint ? `<p class="practice-meta" style="margin-bottom: 1rem;">Hint: ${this.escapeHtml(question.hint)}</p>` : ''}
          ${
            question.type === 'multiple-choice'
              ? `<div class="quiz-options">
              ${question.options
                .map((option, i) => {
                  const selected = answer?.selectedIndex === i;
                  const isCorrect = option === question.correctAnswer;
                  const cls = [
                    'quiz-option',
                    answer && isCorrect ? 'correct' : '',
                    answer && selected && !answer.correct ? 'incorrect' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return `<button class="${cls}" data-action="answerOption" data-index="${i}" ${answer ? 'disabled' : ''}>${this.escapeHtml(option)}</button>`;
                })
                .join('')}
            </div>`
              : `<div class="quiz-typed-wrap">
              <input id="practiceTypedAnswer" class="quiz-typed-input" type="text" placeholder="Type your answer..." ${answer ? 'disabled' : ''} value="${answer ? this.escapeHtml(answer.userAnswer) : ''}">
              <button class="btn btn-primary" data-action="submitTyped" ${answer ? 'disabled' : ''}>Submit</button>
            </div>`
          }
        </div>
        ${
          answer
            ? `<div class="quiz-feedback ${answer.correct ? 'correct' : 'incorrect'}" role="status">
            <strong>${answer.correct ? '✅ Correct' : '❌ Not quite'}</strong>
            <div>${this.escapeHtml(question.explanation || '')}</div>
            ${!answer.correct ? `<div class="practice-meta" style="margin-top: 0.4rem;">Correct answer: ${this.escapeHtml(question.correctAnswer || question.acceptedAnswers?.[0] || '')}</div>` : ''}
          </div>`
            : ''
        }
        <div class="quiz-actions">
          <button class="btn btn-secondary" data-action="exit">Exit Session</button>
          <button class="btn btn-primary" data-action="nextQuestion" ${answer ? '' : 'disabled'}>
            ${session.currentIndex === session.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </button>
        </div>
      </div>`;

    if (question.type === 'typed' && !answer) {
      document.getElementById('practiceTypedAnswer')?.focus();
    }
  }

  // ── Event delegation ─────────────────────────────────────────────────

  /** Wire up data-action event delegation on the container (once). */
  _ensureDelegation(container) {
    if (this._delegationReady) return;
    this._delegationReady = true;

    container.addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      this._handleAction(el.dataset.action, el, container);
    });

    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target.closest('[data-action]');
      if (!el) return;
      // Only handle keyboard on role="button" elements
      if (el.getAttribute('role') === 'button' || el.tagName === 'BUTTON') {
        e.preventDefault();
        this._handleAction(el.dataset.action, el, container);
      }
    });

    // Handle Enter key in typed answer input
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.id === 'practiceTypedAnswer') {
        e.preventDefault();
        this._handleAction('submitTyped', e.target, container);
      }
    });
  }

  /** Central action dispatcher — single point of control for all practice interactions. */
  _handleAction(action, el, container) {
    switch (action) {
      case 'startSession': {
        const palaceId = el.dataset.palaceId;
        if (palaceId) this.startSession(palaceId, container);
        break;
      }
      case 'startNextDue': {
        const palaces = this.palaceManager.getAllPalaces();
        const due = this.practiceManager.getDuePalaces(palaces);
        const target = due[0] || palaces[0];
        if (target) this.startSession(target.id, container);
        break;
      }
      case 'toggleDueOnly':
        this.practiceDueOnly = !this.practiceDueOnly;
        this.renderSelector(container);
        break;
      case 'answerOption':
        this._answerOption(parseInt(el.dataset.index), container);
        break;
      case 'submitTyped':
        this._submitTyped(container);
        break;
      case 'nextQuestion':
        this._nextQuestion(container);
        break;
      case 'restart': {
        const palaceId = this.activePracticeSession?.palaceId;
        this.activePracticeSession = null;
        if (palaceId) this.startSession(palaceId, container);
        break;
      }
      case 'openJourney': {
        const palaceId = this.activePracticeSession?.palaceId;
        this.activePracticeSession = null;
        if (palaceId) this._showJourney(palaceId);
        break;
      }
      case 'exit':
        this.activePracticeSession = null;
        this.renderSelector(container);
        break;
    }
  }

  // ── Quiz logic ───────────────────────────────────────────────────────

  _answerOption(optionIndex, container) {
    const session = this.activePracticeSession;
    if (!session || session.answers[session.currentIndex]) return;

    const question = session.questions[session.currentIndex];
    const selectedOption = question.options[optionIndex];
    const correct = selectedOption === question.correctAnswer;

    session.answers[session.currentIndex] = {
      correct,
      selectedIndex: optionIndex,
      userAnswer: selectedOption,
    };
    if (correct) session.correctCount += 1;
    this.renderActiveSession(container);
  }

  _submitTyped(container) {
    const session = this.activePracticeSession;
    if (!session || session.answers[session.currentIndex]) return;

    const question = session.questions[session.currentIndex];
    const input = document.getElementById('practiceTypedAnswer');
    const userAnswer = input?.value?.trim() || '';
    if (!userAnswer) {
      this.notificationManager?.warning('Type an answer before submitting.');
      return;
    }

    const normalizedUser = this._normalizeText(userAnswer);
    const correct = (question.acceptedAnswers || []).some((ans) =>
      this._answersMatch(normalizedUser, this._normalizeText(ans)),
    );

    session.answers[session.currentIndex] = { correct, userAnswer };
    if (correct) session.correctCount += 1;
    this.renderActiveSession(container);
  }

  _nextQuestion(container) {
    const session = this.activePracticeSession;
    if (!session || !session.answers[session.currentIndex]) return;

    if (session.currentIndex >= session.questions.length - 1) {
      const score = Math.round((session.correctCount / session.questions.length) * 100);
      const stationScores = session.questions.reduce((acc, q, i) => {
        const ans = session.answers[i];
        if (!q.stationNumber || !ans) return acc;
        const key = String(q.stationNumber);
        acc[key] = acc[key] === undefined ? ans.correct : acc[key] && ans.correct;
        return acc;
      }, {});

      const updatedData = this.practiceManager.recordPractice(session.palaceId, {
        score,
        stationScores,
        totalQuestions: session.questions.length,
        correctAnswers: session.correctCount,
        mode: 'quiz',
      });

      const dur = Math.max(1, Math.round((Date.now() - session.startedAt) / 1000));
      session.summary = {
        score,
        correctAnswers: session.correctCount,
        totalQuestions: session.questions.length,
        mastery: updatedData.mastery,
        streak: updatedData.streak,
        durationLabel: dur < 60 ? `${dur}s` : `${Math.round(dur / 60)}m`,
      };
      this._renderPalaces();
      this.renderActiveSession(container);
      return;
    }

    session.currentIndex += 1;
    this.renderActiveSession(container);
  }

  // ── Question builder ─────────────────────────────────────────────────

  _buildQuestions(palace) {
    const stations = (palace.detailedStations || [])
      .filter((s) => s?.title || s?.verses || s?.keywords?.length)
      .sort((a, b) => (a.number || 0) - (b.number || 0))
      .slice(0, 6);

    const questions = [];
    stations.forEach((station, index) => {
      const keywordPool = (station.keywords || []).filter(Boolean);
      const correctCue = keywordPool[0] || station.verses || station.title;
      const distractors = stations
        .filter((o) => o.number !== station.number)
        .map((o) => (o.keywords || []).find(Boolean) || o.verses || o.title)
        .filter(Boolean);

      if (index % 2 === 0 && correctCue && distractors.length >= 2) {
        const options = this._shuffleArray([...new Set([correctCue, ...distractors])]).slice(0, 4);
        if (!options.includes(correctCue)) options[options.length - 1] = correctCue;
        questions.push({
          type: 'multiple-choice',
          stationNumber: station.number || index + 1,
          prompt: `Which cue best matches Station ${station.number || index + 1}: ${station.title || 'Untitled station'}?`,
          hint: station.verses || palace.location || '',
          options: this._shuffleArray(options),
          correctAnswer: correctCue,
          explanation:
            `${station.title || 'Station'} ${station.verses ? `(${station.verses})` : ''}`.trim(),
        });
      } else {
        const accepted = [
          ...new Set([...keywordPool, station.title, station.verses].filter(Boolean)),
        ];
        questions.push({
          type: 'typed',
          stationNumber: station.number || index + 1,
          prompt: `Type one keyword or cue for Station ${station.number || index + 1}: ${station.title || 'Untitled station'}`,
          hint: station.verses || palace.location || '',
          acceptedAnswers: accepted,
          explanation:
            keywordPool.length > 0
              ? `Accepted cues: ${keywordPool.join(', ')}`
              : station.title || station.verses || '',
        });
      }
    });

    if (questions.length > 0) return questions;

    return [
      ['location/theme', palace.location],
      ['book/category', palace.book],
      ['chapter/section', palace.chapter],
      ['station count', palace.stations ? String(palace.stations) : ''],
      ['verse/item count', palace.verses ? String(palace.verses) : ''],
    ]
      .filter(([, v]) => Boolean(v))
      .slice(0, 4)
      .map(([label, value]) => ({
        type: 'typed',
        stationNumber: label,
        prompt: `Type the ${label} for "${palace.name}"`,
        hint: palace.description || palace.notes || '',
        acceptedAnswers: [value],
        explanation: `${label}: ${value}`,
      }));
  }

  // ── Utilities ────────────────────────────────────────────────────────

  _normalizeText(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  _answersMatch(userAnswer, acceptedAnswer) {
    if (!userAnswer || !acceptedAnswer) return false;
    if (userAnswer === acceptedAnswer) return true;
    if (userAnswer.length < 4 || acceptedAnswer.length < 4) return false;
    return acceptedAnswer.includes(userAnswer) || userAnswer.includes(acceptedAnswer);
  }

  _shuffleArray(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
