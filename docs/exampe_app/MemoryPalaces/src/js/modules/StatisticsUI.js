import { Logger } from './Logger.js';
import { APP_VERSION } from './version.js';

/**
 * StatisticsUI — Renders the statistics/analytics modal content.
 * Extracted from UIController for modularity and lazy-loadability.
 */
export class StatisticsUI {
  /**
   * @param {object} deps
   * @param {import('./PalaceManager.js').PalaceManager} deps.palaceManager
   * @param {import('./PracticeManager.js').PracticeManager} deps.practiceManager
   * @param {import('./NotificationManager.js').NotificationManager} deps.notificationManager
   * @param {function} deps.escapeHtml
   * @param {function} deps.formatRelativeTime
   */
  constructor({
    palaceManager,
    practiceManager,
    notificationManager,
    escapeHtml,
    formatRelativeTime,
  }) {
    this.palaceManager = palaceManager;
    this.practiceManager = practiceManager;
    this.notificationManager = notificationManager;
    this.escapeHtml = escapeHtml;
    this.formatRelativeTime = formatRelativeTime;
  }

  /**
   * Render statistics content into the given container element.
   * @param {HTMLElement} container — the #statsContent div
   */
  render(container) {
    if (!this.practiceManager) {
      this.notificationManager?.error('Practice manager not initialized');
      return;
    }

    const palaces = this.palaceManager.getAllPalaces();
    const stats = this.practiceManager.getGlobalStats(palaces);
    const maxWeeklySessions = Math.max(...stats.weeklyActivity.map((day) => day.sessions), 1);

    // Show recent Logger errors if any
    const recentErrors = Logger.getRecentErrors(5);
    const errorSection =
      recentErrors.length > 0
        ? `<section class="stats-panel" style="margin-top: 1.5rem;">
          <h3 class="stats-details-header">⚠️ Recent Warnings</h3>
          <div class="stats-list">
            ${recentErrors
              .map(
                (e) => `
              <div class="stats-list-item">
                <div>
                  <strong>[${this.escapeHtml(e.level.toUpperCase())}]</strong>
                  <div class="practice-meta">${this.escapeHtml(e.message)} — ${this.escapeHtml(e.ts)}</div>
                </div>
              </div>`,
              )
              .join('')}
          </div>
          <button class="btn btn-secondary btn-small" data-action="downloadLogs" style="margin-top: 0.75rem;">
            📋 Download Logs (NDJSON)
          </button>
        </section>`
        : '';

    container.innerHTML = `
      <div class="section-header">
        <span class="section-badge" aria-hidden="true">Analytics</span>
        <h3 class="section-title">Your Progress</h3>
        <p class="section-subtitle">Track your memory palace practice and mastery over time.</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card reveal-up stagger-1">
          <div class="stat-value">${stats.totalPalaces}</div>
          <div class="stat-label">Total Palaces</div>
        </div>
        <div class="stat-card secondary reveal-up stagger-2">
          <div class="stat-value">${stats.totalPracticed}</div>
          <div class="stat-label">Practiced</div>
        </div>
        <div class="stat-card success reveal-up stagger-3">
          <div class="stat-value">${stats.dueToday}</div>
          <div class="stat-label">Due Today</div>
        </div>
        <div class="stat-card reveal-up stagger-4">
          <div class="stat-value">${stats.totalSessions}</div>
          <div class="stat-label">Total Sessions</div>
        </div>
        <div class="stat-card secondary reveal-up stagger-5">
          <div class="stat-value">${stats.averageStreak}</div>
          <div class="stat-label">Avg Streak</div>
        </div>
        <div class="stat-card success reveal-up stagger-6">
          <div class="stat-value">${stats.averageMastery}%</div>
          <div class="stat-label">Avg Mastery</div>
        </div>
        <div class="stat-card secondary reveal-up stagger-6">
          <div class="stat-value">${stats.bestStreak}</div>
          <div class="stat-label">Best Streak</div>
        </div>
      </div>

      <div class="stats-section-grid">
        <section class="stats-panel">
          <h3 class="stats-details-header">📉 Needs Attention</h3>
          ${
            stats.weakestPalaces.length > 0
              ? `<div class="stats-list">
              ${stats.weakestPalaces
                .map(
                  (palace) => `
                  <div class="stats-list-item">
                    <div>
                      <strong>${this.escapeHtml(palace.name)}</strong>
                      <div class="practice-meta">${palace.practiceCount} sessions • ${palace.streak} day streak</div>
                    </div>
                    <span class="practice-badge">${palace.mastery}%</span>
                  </div>`,
                )
                .join('')}
            </div>`
              : '<p class="stats-empty">Start a practice session to surface your weakest palaces.</p>'
          }
        </section>

        <section class="stats-panel">
          <h3 class="stats-details-header">📅 Last 7 Days</h3>
          <div class="weekly-trend">
            ${stats.weeklyActivity
              .map(
                (day) => `
                <div class="weekly-trend-row">
                  <span class="weekly-trend-label">${day.label}</span>
                  <div class="weekly-trend-bar-wrap">
                    <div class="weekly-trend-bar" style="width: ${(day.sessions / maxWeeklySessions) * 100}%"></div>
                  </div>
                  <span class="weekly-trend-value">${day.sessions}</span>
                </div>`,
              )
              .join('')}
          </div>
        </section>
      </div>

      <section class="stats-panel" style="margin-top: 1.5rem;">
        <h3 class="stats-details-header">🕒 Recent Sessions</h3>
        ${
          stats.recentSessions.length > 0
            ? `<div class="stats-list">
              ${stats.recentSessions
                .map(
                  (session) => `
                  <div class="stats-list-item">
                    <div>
                      <strong>${this.escapeHtml(session.palaceName)}</strong>
                      <div class="practice-meta">${this.escapeHtml(session.mode)} • ${session.correctAnswers}/${session.totalQuestions} correct • ${this.formatRelativeTime(session.practicedAt)}</div>
                    </div>
                    <span class="practice-badge ${session.score >= 80 ? 'upcoming' : ''}">${session.score}%</span>
                  </div>`,
                )
                .join('')}
            </div>`
            : '<p class="stats-empty">No practice history yet.</p>'
        }
      </section>

      <h3 class="stats-details-header">Palace Details</h3>
      <div class="stats-details-scroll">
        ${palaces
          .map((p) => {
            const data = this.practiceManager.getPracticeData(p.id);
            const nextReview = this.practiceManager.getNextReviewDate(p.id);
            return `
            <div class="practice-palace-item" style="margin-bottom: 0.5rem;">
              <div class="practice-info">
                <div class="practice-title">${this.escapeHtml(p.name)}</div>
                <div class="practice-meta">
                  📊 Mastery: ${data.mastery}% •
                  🔥 Streak: ${data.streak} days •
                  📝 Sessions: ${data.practiceCount} •
                  📅 Next: ${nextReview}
                </div>
              </div>
            </div>`;
          })
          .join('')}
      </div>
      ${errorSection}
      <p class="stats-empty" style="margin-top: 1.5rem; font-size: 0.8rem; opacity: 0.6;">
        Memory Palace Manager v${APP_VERSION}
      </p>
    `;

    // Wire up log download button via delegation (§8.1)
    // Guard ensures listener is bound only once across multiple render() calls
    if (!this._delegationBound) {
      this._delegationBound = true;
      container.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="downloadLogs"]')) {
          Logger.downloadLogs();
        }
      });
    }
  }
}
