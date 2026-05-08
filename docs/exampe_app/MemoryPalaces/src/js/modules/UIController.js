import { Logger } from './Logger.js';
import { escapeHtml, formatRelativeTime } from './utils.js';

/**
 * UIController - Handles all UI rendering and updates
 */
export class UIController {
  constructor(palaceManager, practiceManager, notificationManager) {
    this.palaceManager = palaceManager;
    this.practiceManager = practiceManager;
    this.notificationManager = notificationManager;
    this.elements = {
      grid: document.getElementById('palacesGrid'),
      emptyState: document.getElementById('emptyState'),
      modal: document.getElementById('palaceModal'),
      modalTitle: document.getElementById('modalTitle'),
      form: document.getElementById('palaceForm'),
      statsModal: document.getElementById('statsModal'),
      practiceModal: document.getElementById('practiceModal'),
      journeyModal: document.getElementById('journeyModal'),
      stationEditorModal: document.getElementById('stationEditorModal'),
      palaceModalPathHint: document.getElementById('palaceModalPathHint'),
      statsModalPathHint: document.getElementById('statsModalPathHint'),
      practiceModalPathHint: document.getElementById('practiceModalPathHint'),
      journeyModalPathHint: document.getElementById('journeyModalPathHint'),
      stationEditorPathHint: document.getElementById('stationEditorPathHint'),
      stationList: document.getElementById('stationList'),
      stationForm: document.getElementById('stationForm'),
      tagsDatalist: document.getElementById('availableTags'),
    };
    this.currentEditId = null;
    this.viewStateStorageKeyBase = 'memoryPalaces:viewState';
    this.viewStateScope = 'guest';
    this.viewStateStorageKey = this._getViewStateStorageKey(this.viewStateScope);
    const savedViewState = this.loadViewState();
    this.currentSort = savedViewState.sort || 'updated';
    this.currentFilter = savedViewState.filter || '';
    /** @type {HTMLElement|null} Tracks focus before modal opens for restoration */
    this._previousFocus = null;
  }

  // ── Focus Management ──────────────────────────────────────────────────

  /** CSS selector for all focusable elements inside a container. */
  static FOCUSABLE_SELECTOR =
    'button:not([disabled]), [href], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /** Save current focus, move focus into the modal, and trap Tab cycling (WCAG 2.2). */
  _trapFocusInModal(modalEl) {
    this._previousFocus = /** @type {HTMLElement} */ (document.activeElement);
    modalEl.classList.add('active');
    modalEl.setAttribute('aria-hidden', 'false');

    // Cache focusable elements and keep it fresh as modal content changes (async renders).
    let focusableCache = [...modalEl.querySelectorAll(UIController.FOCUSABLE_SELECTOR)];
    let mo = null;
    // MutationObserver requires a real DOM Node; skip in environments where modalEl is a mock
    if (typeof MutationObserver !== 'undefined' && modalEl instanceof Node) {
      mo = new MutationObserver(() => {
        focusableCache = [...modalEl.querySelectorAll(UIController.FOCUSABLE_SELECTOR)];
      });
      mo.observe(modalEl, { childList: true, subtree: true });
      modalEl._focusTrapObserver = mo;
    }

    // Attach a keydown handler that traps Tab/Shift+Tab inside the modal
    // and closes the modal on Escape. Store the reference for cleanup.
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        this._releaseModal(modalEl);
        return;
      }
      if (e.key !== 'Tab') return;

      const focusableEls = focusableCache;
      if (focusableEls.length === 0) return;

      const first = /** @type {HTMLElement} */ (focusableEls[0]);
      const last = /** @type {HTMLElement} */ (focusableEls[focusableEls.length - 1]);

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    modalEl._focusTrapHandler = onKeyDown;
    modalEl.addEventListener('keydown', onKeyDown);

    // Focus the first focusable element inside the modal
    requestAnimationFrame(() => {
      const focusable = modalEl.querySelector(UIController.FOCUSABLE_SELECTOR);
      if (focusable) /** @type {HTMLElement} */ (focusable).focus();
    });
  }

  /** Remove active class, tear down focus trap, restore focus to previous element. */
  _releaseModal(modalEl) {
    modalEl.classList.remove('active');
    modalEl.setAttribute('aria-hidden', 'true');

    // Remove the focus-trap keydown listener
    if (modalEl._focusTrapHandler) {
      modalEl.removeEventListener('keydown', modalEl._focusTrapHandler);
      delete modalEl._focusTrapHandler;
    }

    // Disconnect the focusable cache observer
    if (modalEl._focusTrapObserver) {
      modalEl._focusTrapObserver.disconnect();
      delete modalEl._focusTrapObserver;
    }

    if (this._previousFocus && typeof this._previousFocus.focus === 'function') {
      // Only guard with document.contains for real DOM Nodes (avoids crash in test environments)
      const isInDom =
        !(this._previousFocus instanceof Node) || document.contains(this._previousFocus);
      if (isInDom) {
        this._previousFocus.focus();
      } else {
        document.getElementById('newPalaceBtn')?.focus();
      }
      this._previousFocus = null;
    }
  }

  /**
   * Render all palaces
   */
  renderPalaces(filter = this.currentFilter) {
    const t0 = performance.now();
    this.currentFilter = filter || '';
    this.saveViewState();

    let palaces = this.currentFilter
      ? this.palaceManager.searchPalaces(this.currentFilter)
      : this.palaceManager.getAllPalaces();

    // Apply sorting
    palaces = this.sortPalaces(palaces, this.currentSort);

    if (palaces.length === 0) {
      this.elements.grid.innerHTML = '';
      this.elements.emptyState.classList.remove('hidden');
      return;
    }

    this.elements.emptyState.classList.add('hidden');
    this.elements.grid.innerHTML = palaces
      .map((palace, i) => this.renderPalaceCard(palace, i))
      .join('');

    // §8.2 — Track render performance for diagnostics
    const dt = performance.now() - t0;
    /* c8 ignore next 2 */
    if (dt > 50) {
      Logger.warn('Slow render detected', {
        renderMs: Math.round(dt),
        palaceCount: palaces.length,
      });
    }
  }

  /**
   * Sort palaces
   */
  sortPalaces(palaces, sortBy) {
    const sorted = [...palaces];
    switch (sortBy) {
      case 'updated':
        return sorted.sort(
          (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt),
        );
      case 'created':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'stations':
        return sorted.sort((a, b) => (b.stations || 0) - (a.stations || 0));
      case 'verses':
        return sorted.sort((a, b) => (b.verses || 0) - (a.verses || 0));
      default:
        return sorted;
    }
  }

  /**
   * Set current sort
   */
  setSort(sortBy) {
    this.currentSort = sortBy;
    this.saveViewState();
    this.renderPalaces(this.currentFilter);
  }

  setFilter(filter) {
    this.renderPalaces(filter);
  }

  getCurrentFilter() {
    return this.currentFilter;
  }

  getCurrentSort() {
    return this.currentSort;
  }

  _getViewStateStorageKey(scope = 'guest') {
    return `${this.viewStateStorageKeyBase}:${scope}`;
  }

  setViewScope(scope = 'guest') {
    const nextScope = scope || 'guest';
    if (nextScope === this.viewStateScope) return;

    this.viewStateScope = nextScope;
    this.viewStateStorageKey = this._getViewStateStorageKey(nextScope);

    const savedViewState = this.loadViewState();
    this.currentSort = savedViewState.sort || 'updated';
    this.currentFilter = savedViewState.filter || '';

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = this.currentFilter;

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = this.currentSort;
  }

  loadViewState() {
    try {
      const raw = localStorage.getItem(this.viewStateStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      Logger.error('Error loading UI state', { error: String(error) });
      return {};
    }
  }

  saveViewState() {
    try {
      localStorage.setItem(
        this.viewStateStorageKey,
        JSON.stringify({
          sort: this.currentSort,
          filter: this.currentFilter,
        }),
      );
    } catch (error) {
      Logger.error('Error saving UI state', { error: String(error) });
    }
  }

  /**
   * Render single palace card
   */
  renderPalaceCard(palace, index = 0) {
    const connections = palace.connections || [];
    const connectedPalaces = connections
      .map((id) => {
        const p = this.palaceManager.getPalaceById(id);
        return p ? p.name : null;
      })
      .filter(Boolean);

    // Stagger class caps at 6 to avoid excessive delay on large grids
    const stagger = Math.min(index + 1, 6);

    return `
      <div class="palace-card reveal-up stagger-${stagger}" data-id="${palace.id}" style="position: relative;">
        ${this.renderMasteryBadge(palace.id)}
        <div class="palace-header">
          <div>
            <div class="palace-title">${this.escapeHtml(palace.name)}</div>
            <div class="palace-meta">
              📍 ${this.escapeHtml(palace.location)}
              ${
                palace.book
                  ? `· 📖 ${this.escapeHtml(palace.book)}${palace.chapter ? ' ' + this.escapeHtml(palace.chapter) : ''}`
                  : ''
              }
            </div>
          </div>
        </div>

        ${palace.description ? `<div class="palace-description">"${this.escapeHtml(palace.description)}"</div>` : ''}

        <div class="palace-stats">
          ${palace.stations ? `<div class="stat">🗺️ ${palace.stations} stations</div>` : ''}
          ${palace.verses ? `<div class="stat">📜 ${palace.verses} items</div>` : ''}
        </div>

        ${
          connectedPalaces.length > 0
            ? `
          <div class="palace-connections">
            <small class="palace-connections-label">🔗 Connected to:</small>
            <div class="palace-connections-list">
              ${connectedPalaces.map((name) => this.escapeHtml(name)).join(', ')}
            </div>
          </div>
        `
            : ''
        }

        ${
          palace.tags && palace.tags.length > 0
            ? `
          <div class="tags">
            ${palace.tags.map((tag) => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
          </div>
        `
            : ''
        }

        ${
          palace.notes
            ? `
          <div class="palace-notes-inline">
            💡 ${this.escapeHtml(palace.notes)}
          </div>
        `
            : ''
        }

        ${this.renderPracticeProgress(palace.id)}

        <div class="palace-actions">
          <button class="btn btn-primary btn-small edit-btn" data-id="${palace.id}" aria-label="Edit ${this.escapeHtml(palace.name)}">✏️ Edit</button>
          <button class="btn btn-secondary btn-small stations-btn" data-id="${palace.id}" aria-label="Manage stations for ${this.escapeHtml(palace.name)}">🪜 Stations</button>
          <button class="btn btn-secondary btn-small duplicate-btn" data-id="${palace.id}" aria-label="Duplicate ${this.escapeHtml(palace.name)}">📄 Duplicate</button>
          <button class="btn btn-secondary btn-small journey-btn" data-id="${palace.id}" aria-label="Journey through ${this.escapeHtml(palace.name)}" ${!palace.detailedStations || palace.detailedStations.length === 0 ? 'title="Add stations to enable journey"' : ''}>
            ${!palace.detailedStations || palace.detailedStations.length === 0 ? '➕ Journey' : '🗺️ Journey'}
          </button>
          <button class="btn btn-secondary btn-small export-btn" data-id="${palace.id}" aria-label="Export ${this.escapeHtml(palace.name)}">💾 Export</button>
          <button class="btn btn-danger btn-small delete-btn" data-id="${palace.id}" aria-label="Delete ${this.escapeHtml(palace.name)}">🗑️ Delete</button>
        </div>
      </div>
    `;
  }

  /**
   * Open modal for new palace
   */
  openNewPalaceModal() {
    this.currentEditId = null;
    this.elements.modalTitle.textContent = 'New Memory Palace';
    this.elements.form.reset();
    this.populateConnectionsSelect();
    this.populateTagsDatalist();
    this.setModalPathHint('palaceModalPathHint', 'Palaces / Create');
    this.showModal();
  }

  /**
   * Open modal for editing palace
   */
  openEditPalaceModal(id) {
    this.currentEditId = id;
    const palace = this.palaceManager.getPalaceById(id);

    if (!palace) return;

    this.elements.modalTitle.textContent = 'Edit Memory Palace';

    // Populate form fields
    document.getElementById('palaceName').value = palace.name || '';
    document.getElementById('palaceLocation').value = palace.location || '';
    document.getElementById('palaceDescription').value = palace.description || '';
    document.getElementById('palaceBook').value = palace.book || '';
    document.getElementById('palaceChapter').value = palace.chapter || '';
    document.getElementById('palaceStations').value = palace.stations || '';
    document.getElementById('palaceVerses').value = palace.verses || '';
    document.getElementById('palaceTags').value = palace.tags ? palace.tags.join(', ') : '';
    document.getElementById('palaceNotes').value = palace.notes || '';

    this.populateConnectionsSelect(id);
    this.populateTagsDatalist();
    this.setModalPathHint('palaceModalPathHint', `Palaces / Edit / ${palace.name || 'Selected'}`);

    // Set selected connections
    const select = document.getElementById('palaceConnections');
    /* c8 ignore next 3 */
    Array.from(select.options).forEach((option) => {
      option.selected = palace.connections?.includes(option.value);
    });

    this.showModal();
  }

  /**
   * Show modal
   */
  showModal() {
    this._trapFocusInModal(this.elements.modal);
  }

  /**
   * Hide modal
   */
  hideModal() {
    this._releaseModal(this.elements.modal);
    this.currentEditId = null;
  }

  /**
   * Populate connections select dropdown
   */
  populateConnectionsSelect(excludeId = null) {
    const select = document.getElementById('palaceConnections');
    const palaces = this.palaceManager.getAllPalaces().filter((p) => p.id !== excludeId);

    select.innerHTML = palaces
      .map(
        (p) =>
          `<option value="${p.id}">${this.escapeHtml(p.name)}${p.book ? ` (${this.escapeHtml(p.book)}${p.chapter ? ' ' + this.escapeHtml(p.chapter) : ''})` : ''}</option>`,
      )
      .join('');
  }

  /**
   * Populate tags datalist
   */
  populateTagsDatalist() {
    if (!this.elements.tagsDatalist) return;

    // Collect all unique tags
    const allPalaces = this.palaceManager.getAllPalaces();
    const tags = new Set();

    allPalaces.forEach((p) => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach((tag) => tags.add(tag));
      }
    });

    this.elements.tagsDatalist.innerHTML = Array.from(tags)
      .sort()
      .map((tag) => `<option value="${this.escapeHtml(tag)}">`)
      .join('');
  }

  /**
   * Get current edit ID
   */
  getCurrentEditId() {
    return this.currentEditId;
  }

  /**
   * Render mastery badge
   */
  renderMasteryBadge(palaceId) {
    if (!this.practiceManager) return '';

    const data = this.practiceManager.getPracticeData(palaceId);
    if (!data || data.practiceCount === 0) return '';

    const level = data.mastery >= 80 ? 'high' : data.mastery >= 50 ? 'medium' : 'low';
    return `<div class="mastery-badge ${level}">${data.mastery}% Mastery</div>`;
  }

  /**
   * Render practice progress
   */
  renderPracticeProgress(palaceId) {
    if (!this.practiceManager) return '';

    const data = this.practiceManager.getPracticeData(palaceId);
    if (!data || data.practiceCount === 0) return '';

    return `
      <div class="palace-progress">
        <div class="progress-bar-container">
          <div class="progress-bar"
               style="width: ${data.mastery}%"
               role="progressbar"
               aria-valuenow="${data.mastery}"
               aria-valuemin="0"
               aria-valuemax="100"
               aria-label="${data.mastery}% mastery"></div>
        </div>
        <div class="progress-label">
          <span>🔥 ${data.streak} day streak</span>
          <span>📝 ${data.practiceCount} sessions</span>
        </div>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS.
   * Delegates to the shared utility in utils.js (single source of truth).
   */
  escapeHtml(text) {
    return escapeHtml(text);
  }

  /**
   * Download file
   */
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Hide journey modal
   */
  hideJourney() {
    this._releaseModal(this.elements.journeyModal);
  }

  /**
   * Show statistics modal — lazy-loads StatisticsUI on first use.
   */
  async showStatistics() {
    const container = document.getElementById('statsContent');
    container.innerHTML = this.renderSkeleton('stats');
    this.setModalPathHint('statsModalPathHint', 'Dashboard / Statistics');
    this._trapFocusInModal(this.elements.statsModal);

    try {
      if (!this._statisticsUI) {
        const { StatisticsUI } = await import('./StatisticsUI.js');
        this._statisticsUI = new StatisticsUI({
          palaceManager: this.palaceManager,
          practiceManager: this.practiceManager,
          notificationManager: this.notificationManager,
          escapeHtml: /* c8 ignore next */ (text) => this.escapeHtml(text),
          formatRelativeTime: /* c8 ignore next */ (iso) => this.formatRelativeTime(iso),
        });
      }
      this._statisticsUI.render(container);

      // Stat cards use reveal-up + stagger for entrance animation.
      // Since they're inside a modal (not page scroll), reveal them immediately.
      // Also focus the first focusable element now that async content is rendered.
      requestAnimationFrame(() => {
        container.querySelectorAll('.reveal-up').forEach((el) => el.classList.add('revealed'));
        const focusable = this.elements.statsModal.querySelector(UIController.FOCUSABLE_SELECTOR);
        if (focusable) /** @type {HTMLElement} */ (focusable).focus();
      });
    } catch (err) {
      container.innerHTML = '<p style="color:var(--danger)">Failed to load statistics module.</p>';
      Logger.error('StatisticsUI load error', { error: String(err) });
    }
  }

  /**
   * Hide statistics modal
   */
  hideStatistics() {
    this._releaseModal(this.elements.statsModal);
  }

  /**
   * Show practice modal — lazy-loads PracticeUI on first use.
   */
  async showPractice() {
    const container = document.getElementById('practiceContent');
    container.innerHTML = this.renderSkeleton('practice');
    this.setModalPathHint('practiceModalPathHint', 'Training / Practice');
    this._trapFocusInModal(this.elements.practiceModal);

    try {
      if (!this._practiceUI) {
        const { PracticeUI } = await import('./PracticeUI.js');
        this._practiceUI = new PracticeUI({
          palaceManager: this.palaceManager,
          practiceManager: this.practiceManager,
          notificationManager: this.notificationManager,
          escapeHtml: /* c8 ignore next */ (text) => this.escapeHtml(text),
          renderPalaces: /* c8 ignore next */ () => this.renderPalaces(),
          showJourney: /* c8 ignore next */ (palaceId) => {
            this.hidePractice();
            this.showJourney(palaceId);
          },
        });
      }

      if (this._practiceUI.hasActiveSession()) {
        this._practiceUI.renderActiveSession(container);
      } else {
        this._practiceUI.renderSelector(container);
      }
      requestAnimationFrame(() => {
        const focusable = this.elements.practiceModal.querySelector(
          UIController.FOCUSABLE_SELECTOR,
        );
        if (focusable) /** @type {HTMLElement} */ (focusable).focus();
      });
    } catch (err) {
      container.innerHTML = '<p style="color:var(--danger)">Failed to load practice module.</p>';
      Logger.error('PracticeUI load error', { error: String(err) });
    }
  }

  /**
   * Start a practice session directly (called from EventHandlers grid delegation).
   */
  startPracticeSession(palaceId) {
    this.showPractice()
      .then(() => {
        const container = document.getElementById('practiceContent');
        if (this._practiceUI) {
          this._practiceUI.startSession(palaceId, container);
        }
      })
      .catch((err) => {
        Logger.error('startPracticeSession failed', { error: String(err) });
      });
  }

  /**
   * Hide practice modal
   */
  hidePractice() {
    this._releaseModal(this.elements.practiceModal);
  }

  formatRelativeTime(isoDate) {
    return formatRelativeTime(isoDate);
  }

  /**
   * Show journey viewer — lazy-loads JourneyUI on first use.
   */
  async showJourney(palaceId) {
    const container = document.getElementById('journeyContent');
    container.innerHTML = this.renderSkeleton('journey');
    const palaceName = this.palaceManager.getPalaceById(palaceId)?.name || 'Journey';
    this.setModalPathHint('journeyModalPathHint', `Palaces / Journey / ${palaceName}`);
    this._trapFocusInModal(this.elements.journeyModal);

    try {
      if (!this._journeyUI) {
        const { JourneyUI } = await import('./JourneyUI.js');
        this._journeyUI = new JourneyUI({
          palaceManager: this.palaceManager,
          notificationManager: this.notificationManager,
          escapeHtml: (text) => this.escapeHtml(text),
        });
      }
      const rendered = this._journeyUI.render(palaceId, container);
      if (!rendered) {
        this._releaseModal(this.elements.journeyModal);
      } else {
        requestAnimationFrame(() => {
          const focusable = this.elements.journeyModal.querySelector(
            UIController.FOCUSABLE_SELECTOR,
          );
          if (focusable) /** @type {HTMLElement} */ (focusable).focus();
        });
      }
    } catch (err) {
      container.innerHTML = '<p style="color:var(--danger)">Failed to load journey module.</p>';
      Logger.error('JourneyUI load error', { error: String(err) });
    }
  }

  /**
   * Open station editor — lazy-loads StationEditorUI on first use.
   */
  async openStationEditor(id) {
    const palaceName = this.palaceManager.getPalaceById(id)?.name || 'Selected Palace';
    this.setModalPathHint('stationEditorPathHint', `Palaces / Stations / ${palaceName}`);
    this._trapFocusInModal(this.elements.stationEditorModal);
    try {
      if (!this._stationEditorUI) {
        const { StationEditorUI } = await import('./StationEditorUI.js');
        this._stationEditorUI = new StationEditorUI({
          palaceManager: this.palaceManager,
          notificationManager: this.notificationManager,
          escapeHtml: (text) => this.escapeHtml(text),
        });
      }
      const opened = this._stationEditorUI.open(id);
      if (!opened) {
        this._releaseModal(this.elements.stationEditorModal);
      }
    } catch (err) {
      Logger.error('StationEditorUI load error', { error: String(err) });
    }
  }

  hideStationEditor() {
    this._releaseModal(this.elements.stationEditorModal);
    this._stationEditorUI?.close();
  }

  /** Delegate to StationEditorUI if loaded. */
  clearStationForm() {
    this._stationEditorUI?.clearStationForm();
  }

  /** Delegate to StationEditorUI if loaded. */
  saveStation() {
    this._stationEditorUI?.saveStation(() => this.renderPalaces());
  }

  /**
   * Set small breadcrumb-style context text in a modal header.
   */
  setModalPathHint(hintElementKey, text) {
    const el = this.elements[hintElementKey];
    if (el) {
      el.textContent = text;
    }
  }

  /**
   * Reusable skeleton shell for async modal module loading.
   */
  renderSkeleton(type = 'generic') {
    return `
      <div class="skeleton-shell" aria-live="polite" aria-label="Loading ${this.escapeHtml(type)}">
        <div class="skeleton-line short"></div>
        <div class="skeleton-block"></div>
        <div class="skeleton-block"></div>
      </div>
    `;
  }
}
