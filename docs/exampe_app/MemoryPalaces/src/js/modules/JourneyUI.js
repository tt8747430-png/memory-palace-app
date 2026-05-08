import { sanitizeHtml } from './validation.js';

/**
 * JourneyUI - Renders the Journey viewer modal content.
 * Extracted from UIController for modularity and lazy-loadability.
 */
export class JourneyUI {
  constructor({ palaceManager, notificationManager, escapeHtml }) {
    this.palaceManager = palaceManager;
    this.notificationManager = notificationManager;
    this.escapeHtml = escapeHtml;
  }

  /**
   * Render the journey for a given palace into the container.
   * Uses data-action event delegation instead of window.* globals.
   * @param {string} palaceId
   * @param {HTMLElement} container - the #journeyContent div
   * @returns {boolean} true if rendered, false if nothing to show
   */
  render(palaceId, container) {
    const palace = this.palaceManager.getPalaceById(palaceId);
    if (!palace) return false;

    const stations = palace.detailedStations || [];
    if (stations.length === 0) {
      this.notificationManager?.warning('This palace has no detailed station data yet.');
      return false;
    }

    const isRichHtml = palace.sourceFormat === 'html';
    const esc = this.escapeHtml;

    const renderStation = (index) => {
      const station = stations[index];

      let zoneHtml = '';
      if (station.zone) {
        const isFirstInZone = index === 0 || stations[index - 1]?.zone !== station.zone;
        if (isFirstInZone) {
          zoneHtml = `<div class="journey-zone-header">${esc(station.zone)}</div>`;
        }
      }

      let imageSection = '';
      if (isRichHtml && station.imageHtml) {
        imageSection = `
          <div class="journey-image-box">
            <div class="journey-image-label">${esc(station.imageLabel || '🎨 Imaginea')}</div>
            <p>${sanitizeHtml(station.imageHtml)}</p>
          </div>`;
      } else if (station.summary || station.image) {
        imageSection = `
          <div class="journey-station-image">
            <strong>🎨 Memory Image:</strong> ${esc(station.summary || station.image || '')}
          </div>`;
      }

      let sensesSection = '';
      if (station.senses?.length > 0) {
        sensesSection = `<div class="journey-senses">
          ${station.senses.map((s) => `<span class="journey-sense-tag">${esc(s)}</span>`).join('')}
        </div>`;
      }

      let verseSection = '';
      if (station.verseBlocks?.length > 0) {
        verseSection = station.verseBlocks
          .map(
            (vb) => `
          <div class="journey-verse-box">
            <div class="journey-verse-ref">${esc(vb.ref)}</div>
            <div class="journey-verse-text">${vb.html ? sanitizeHtml(vb.html) : esc(vb.text)}</div>
          </div>`,
          )
          .join('');
      }

      let keywordsSection = '';
      if (!isRichHtml && station.keywords?.length > 0) {
        keywordsSection = `<div class="journey-keywords">
          ${station.keywords.map((kw) => `<span class="journey-keyword">${esc(kw)}</span>`).join('')}
        </div>`;
      }

      return `
        <div class="journey-progress" role="navigation" aria-label="Station progress">
          ${stations
            .map(
              (_, i) => `
            <div class="journey-dot ${i === index ? 'active' : i < index ? 'visited' : ''}"
                 data-action="jumpToStation" data-index="${i}" role="button" tabindex="0"
                 aria-label="Go to station ${i + 1}"></div>`,
            )
            .join('')}
        </div>
        ${zoneHtml}
        <div class="journey-station ${isRichHtml ? 'journey-station-rich' : ''}">
          <div class="journey-station-header">
            <div class="journey-station-num">${station.number}</div>
            <div>
              <div class="journey-station-title">${esc(station.title)}</div>
              <div class="journey-station-verses">${esc(station.verses || '')}</div>
            </div>
          </div>
          <div class="journey-station-content">
            ${imageSection}${sensesSection}${verseSection}${keywordsSection}
          </div>
          <div class="journey-controls">
            <button class="btn btn-secondary" data-action="previousStation" ${index === 0 ? 'disabled' : ''}>⬅️ Previous</button>
            <div class="journey-station-counter" role="status">Station ${index + 1} of ${stations.length}</div>
            <button class="btn btn-primary" data-action="nextStation" ${index === stations.length - 1 ? 'disabled' : ''}>Next ➡️</button>
          </div>
        </div>`;
    };

    let currentIndex = 0;
    const update = () => {
      container.innerHTML = renderStation(currentIndex);
    };

    // Use AbortController so listeners are removed on the next render() call (prevents stacking)
    if (this._renderAbort) {
      this._renderAbort.abort();
    }
    this._renderAbort = new AbortController();
    const { signal } = this._renderAbort;

    // Event delegation — replaces window.nextStation / previousStation / jumpToStation globals
    container.addEventListener(
      'click',
      (e) => {
        const actionEl = e.target.closest('[data-action]');
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        if (action === 'nextStation' && currentIndex < stations.length - 1) {
          currentIndex++;
          update();
        } else if (action === 'previousStation' && currentIndex > 0) {
          currentIndex--;
          update();
        } else if (action === 'jumpToStation') {
          currentIndex = parseInt(actionEl.dataset.index);
          update();
        }
      },
      { signal },
    );

    // Keyboard support for journey dots
    container.addEventListener(
      'keydown',
      (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset?.action === 'jumpToStation') {
          e.preventDefault();
          currentIndex = parseInt(e.target.dataset.index);
          update();
        }
      },
      { signal },
    );

    document.getElementById('journeyModalTitle').textContent = `🗺️ ${palace.name} - Journey`;
    update();
    return true;
  }
}
