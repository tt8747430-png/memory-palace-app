import { HtmlPalaceParser } from './HtmlPalaceParser.js';
import { validatePalace } from './validation.js';
import { Logger } from './Logger.js';

/**
 * EventHandlers - Manages all event listeners
 */
export class EventHandlers {
  constructor(palaceManager, uiController, themeManager, notificationManager, syncManager = null) {
    this.palaceManager = palaceManager;
    this.uiController = uiController;
    this.themeManager = themeManager;
    this.notificationManager = notificationManager;
    this.syncManager = syncManager;
  }

  /**
   * Initialize all event listeners
   */
  init() {
    this.setupToolbarEvents();
    this.setupModalEvents();
    this.setupFormEvents();
    this.setupGridEvents();
    this.setupKeyboardShortcuts();
    this.setupMobileNavEvents();
    this.setupUtilityUiEvents();
  }

  /**
   * Safely attach an event listener to a DOM element by ID.
   * Logs a warning instead of throwing if the element is not found.
   * @param {string} id - Element ID
   * @param {string} event - Event type
   * @param {EventListener} handler - Listener function
   * @param {AddEventListenerOptions} [options]
   */
  _on(id, event, handler, options) {
    const el = document.getElementById(id);
    if (!el) {
      Logger.warn(`EventHandlers: element #${id} not found`);
      return;
    }
    el.addEventListener(event, handler, options);
  }

  /**
   * Setup lightweight utility UI events (scroll-top FAB, etc.)
   */
  setupUtilityUiEvents() {
    const scrollFab = document.getElementById('scrollTopFab');
    if (!scrollFab) return;

    const updateFabVisibility = () => {
      const show = (window.scrollY || window.pageYOffset || 0) > 320;
      scrollFab.classList.toggle('visible', show);
      scrollFab.setAttribute('aria-hidden', show ? 'false' : 'true');
    };

    window.addEventListener('scroll', updateFabVisibility, { passive: true });
    updateFabVisibility();

    scrollFab.addEventListener('click', () => {
      if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  /**
   * Setup toolbar events
   */
  setupToolbarEvents() {
    this._on('newPalaceBtn', 'click', () => this.uiController.openNewPalaceModal());
    this._on('importBtn', 'click', () => this.handleImport());
    this._on('exportAllBtn', 'click', () => this.handleExportAll());
    this._on('practiceBtn', 'click', () => this.uiController.showPractice());

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = this.uiController.getCurrentFilter();
      searchInput.addEventListener('input', (e) => this.uiController.setFilter(e.target.value));
    }

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.value = this.uiController.getCurrentSort();
      sortSelect.addEventListener('change', (e) => this.uiController.setSort(e.target.value));
    }

    // Header actions
    this._on('themeToggle', 'click', () => {
      if (!this.themeManager) {
        Logger.error('Theme manager not initialized');
        return;
      }
      const newTheme = this.themeManager.toggleTheme();
      const btn = document.getElementById('themeToggle');
      const icons = { light: '🌙', dark: '💻', auto: '☀️' };
      const iconSpan = btn.querySelector('[aria-hidden]') || btn;
      iconSpan.textContent = icons[newTheme] || '🌙';
      btn.title = `Theme: ${newTheme} (click to change)`;
    });

    // Set initial theme button icon
    {
      const theme = this.themeManager?.currentTheme || 'auto';
      const icons = { light: '🌙', dark: '💻', auto: '☀️' };
      const btn = document.getElementById('themeToggle');
      if (btn) {
        const iconSpan = btn.querySelector('[aria-hidden]') || btn;
        iconSpan.textContent = icons[theme] || '🌙';
        btn.title = `Theme: ${theme} (click to change)`;
      }
    }

    this._on('statsBtn', 'click', () => this.uiController.showStatistics());
    this._on('syncBtn', 'click', () => this.handleSyncClick());
  }

  /**
   * Setup modal events
   */
  setupModalEvents() {
    this._on('closeModalBtn', 'click', () => this.uiController.hideModal());
    this._on('cancelBtn', 'click', () => this.uiController.hideModal());
    this._on('closeStatsBtn', 'click', () => this.uiController.hideStatistics());
    this._on('closePracticeBtn', 'click', () => this.uiController.hidePractice());
    this._on('closeJourneyBtn', 'click', () => this.uiController.hideJourney());
    this._on('closeStationEditorBtn', 'click', () => this.uiController.hideStationEditor());
    this._on('cancelStationBtn', 'click', () => this.uiController.clearStationForm());
    this._on('addNewStationBtn', 'click', () => this.uiController.clearStationForm());
    this._on('stationForm', 'submit', (e) => {
      e.preventDefault();
      this.uiController.saveStation();
    });

    // Close on outside click
    this._on('palaceModal', 'click', (e) => {
      if (e.target.id === 'palaceModal') this.uiController.hideModal();
    });
    this._on('statsModal', 'click', (e) => {
      if (e.target.id === 'statsModal') this.uiController.hideStatistics();
    });
    this._on('practiceModal', 'click', (e) => {
      if (e.target.id === 'practiceModal') this.uiController.hidePractice();
    });
    this._on('journeyModal', 'click', (e) => {
      if (e.target.id === 'journeyModal') this.uiController.hideJourney();
    });
    this._on('stationEditorModal', 'click', (e) => {
      if (e.target.id === 'stationEditorModal') this.uiController.hideStationEditor();
    });
  }

  /**
   * Setup form events
   */
  setupFormEvents() {
    this._on('palaceForm', 'submit', (e) => {
      e.preventDefault();
      this.handleSavePalace();
    });
  }

  /**
   * Setup grid events (using event delegation)
   */
  setupGridEvents() {
    const grid = document.getElementById('palacesGrid');

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.palace-card');
      if (!card) return;

      const id = card.dataset.id;

      // Edit button
      if (e.target.closest('.edit-btn')) {
        e.stopPropagation();
        this.uiController.openEditPalaceModal(id);
        return;
      }

      // Export button
      if (e.target.closest('.export-btn')) {
        e.stopPropagation();
        this.handleExportSingle(id);
        return;
      }

      // Delete button
      if (e.target.closest('.delete-btn')) {
        e.stopPropagation();
        this.handleDelete(id);
        return;
      }

      // Duplicate button
      if (e.target.closest('.duplicate-btn')) {
        e.stopPropagation();
        this.handleDuplicate(id);
        return;
      }

      // Journey button
      if (e.target.closest('.journey-btn')) {
        e.stopPropagation();
        const palace = this.palaceManager.getPalaceById(id);
        if (!palace.detailedStations || palace.detailedStations.length === 0) {
          this.notificationManager.confirm(
            'This palace has no stations yet. Add some now to create a journey?',
            () => this.uiController.openStationEditor(id),
          );
        } else {
          this.uiController.showJourney(id);
        }
        return;
      }

      // Stations button
      if (e.target.closest('.stations-btn')) {
        e.stopPropagation();
        this.uiController.openStationEditor(id);
        return;
      }

      // Card click (edit)
      if (!e.target.closest('.palace-actions')) {
        this.uiController.openEditPalaceModal(id);
      }
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Escape to close modals
      if (e.key === 'Escape') {
        this.closeMobileNav();
        this.uiController.hideModal();
        this.uiController.hideStatistics();
        this.uiController.hidePractice();
        this.uiController.hideJourney();
        this.uiController.hideStationEditor();
      }

      // Ctrl/Cmd + N for new palace
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.uiController.openNewPalaceModal();
      }

      // Ctrl/Cmd + P for practice
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        this.uiController.showPractice();
      }

      // Ctrl/Cmd + K for stats
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.uiController.showStatistics();
      }

      // Slash to focus search quickly
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target;
        const tagName =
          target && typeof target === 'object' && 'tagName' in target ? target.tagName : '';
        const isTypingTarget = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
        if (!isTypingTarget) {
          e.preventDefault();
          const searchInput = document.getElementById('searchInput');
          if (searchInput && typeof searchInput.focus === 'function') {
            searchInput.focus();
          }
        }
      }

      // Ctrl/Cmd + Shift + Backspace clears current search
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Backspace') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        searchInput.value = '';
        this.uiController.setFilter('');
      }
    });
  }

  /**
   * Setup mobile navigation drawer — hamburger toggle + data-action delegation
   */
  setupMobileNavEvents() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const drawer = document.getElementById('mobileNavDrawer');

    if (!hamburgerBtn || !drawer) return;

    // Toggle hamburger
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('open');
      if (isOpen) {
        this.closeMobileNav();
      } else {
        this.openMobileNav();
      }
    });

    // Delegate all data-action clicks inside the drawer
    drawer.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;

      const action = actionEl.dataset.action;

      // Always close drawer on any action
      this.closeMobileNav();

      switch (action) {
        case 'close-mobile-nav':
          // Already closed above
          break;
        case 'mobile-new-palace':
          this.uiController.openNewPalaceModal();
          break;
        case 'mobile-import':
          this.handleImport();
          break;
        case 'mobile-export':
          this.handleExportAll();
          break;
        case 'mobile-practice':
          this.uiController.showPractice();
          break;
        case 'mobile-stats':
          this.uiController.showStatistics();
          break;
        case 'mobile-theme':
          if (this.themeManager) {
            const newTheme = this.themeManager.toggleTheme();
            const btn = document.getElementById('themeToggle');
            const icons = { light: '🌙', dark: '💻', auto: '☀️' };
            const iconSpan = btn?.querySelector('[aria-hidden]') || btn;
            if (iconSpan) iconSpan.textContent = icons[newTheme] || '🌙';
            if (btn) btn.title = `Theme: ${newTheme} (click to change)`;
          }
          break;
        case 'mobile-sync':
          this.handleSyncClick();
          break;
        default:
          Logger.warn(`Unknown mobile nav action: ${action}`);
      }
    });
  }

  /**
   * Open mobile navigation drawer
   */
  openMobileNav() {
    const drawer = document.getElementById('mobileNavDrawer');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (!drawer || !hamburgerBtn) return;

    // Remove inert FIRST so the drawer's children become focusable/interactive
    drawer.removeAttribute('inert');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    hamburgerBtn.classList.add('active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Move focus into the drawer for keyboard/screen-reader users
    const closeBtn = drawer.querySelector('.mobile-nav-close');
    if (closeBtn) closeBtn.focus();
  }

  /**
   * Close mobile navigation drawer
   */
  closeMobileNav() {
    const drawer = document.getElementById('mobileNavDrawer');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (!drawer || !hamburgerBtn) return;

    // Move focus OUT of the drawer BEFORE setting inert/aria-hidden,
    // otherwise the browser warns about aria-hidden on a focused descendant.
    hamburgerBtn.focus();
    drawer.classList.remove('open');
    // 'inert' prevents any descendant from receiving focus, eliminating the
    // aria-hidden-on-focused-element warning browsers emit with aria-hidden alone.
    drawer.setAttribute('inert', '');
    drawer.setAttribute('aria-hidden', 'true');
    hamburgerBtn.classList.remove('active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  /**
   * Handle sync button click
   */
  async handleSyncClick() {
    const sm = this.syncManager;

    if (!sm || !sm.isConfigured) {
      // Firebase not configured — show setup instructions
      this.notificationManager.info(
        '☁️ Cloud sync is not configured. Add your Firebase project credentials to enable syncing across devices.',
      );
      return;
    }

    if (sm.initFailed) {
      // Credentials exist but Firebase SDK failed to initialize
      this.notificationManager.error(
        '☁️ Firebase failed to initialize. Check your internet connection and Firebase project settings, then reload.',
      );
      return;
    }

    if (!sm.isReady) {
      this.notificationManager.info('Sync is initializing. Please try again in a moment.');
      return;
    }

    if (sm.isSignedIn()) {
      // Already signed in — offer sign-out
      const user = sm.getUserInfo();
      this.notificationManager.confirm(
        `Signed in as ${user.name || user.email}. Sign out of cloud sync?`,
        async () => {
          await sm.signOut();
          this.notificationManager.info('Signed out of cloud sync.');
        },
      );
    } else {
      // Not signed in — start Google sign-in flow
      try {
        this.notificationManager.info('Opening Google sign-in…');
        await sm.signIn();
        // Auth state change listener in app.js will handle the rest
      } catch (err) {
        Logger.error('Sign-in failed', { code: err?.code, message: String(err) });
        const code = err?.code || '';
        if (code === 'auth/popup-closed-by-user') {
          this.notificationManager.warning('Sign-in canceled. You closed the Google window.');
          return;
        }
        this.notificationManager.error('Sign-in failed. Check Firebase domains/config and retry.');
      }
    }
  }

  /**
   * Handle save palace
   */
  handleSavePalace() {
    const formData = {
      name: document.getElementById('palaceName').value,
      location: document.getElementById('palaceLocation').value,
      description: document.getElementById('palaceDescription').value,
      book: document.getElementById('palaceBook').value,
      chapter: document.getElementById('palaceChapter').value,
      stations: parseInt(document.getElementById('palaceStations').value) || 0,
      verses: parseInt(document.getElementById('palaceVerses').value) || 0,
      tags: document
        .getElementById('palaceTags')
        .value.split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      notes: document.getElementById('palaceNotes').value,
      connections: Array.from(document.getElementById('palaceConnections').selectedOptions).map(
        /* c8 ignore next */ (o) => o.value,
      ),
    };

    const editId = this.uiController.getCurrentEditId();

    if (editId) {
      this.palaceManager.updatePalace(editId, formData);
      this.notificationManager.success('Palace updated successfully');
    } else {
      this.palaceManager.createPalace(formData);
      this.notificationManager.success('Palace created successfully');
    }

    this.uiController.hideModal();
  }

  /**
   * Handle delete palace
   */
  handleDelete(id) {
    const palace = this.palaceManager.getPalaceById(id);
    if (!palace) return;

    this.notificationManager.confirm(
      `Delete "${palace.name}"? You'll have a few seconds to undo it.`,
      () => {
        const deletedRecord = this.palaceManager.deletePalace(id, { skipSync: true });
        if (!deletedRecord) return;

        this.notificationManager.show(`"${palace.name}" deleted`, 'warning', 5000, {
          actionLabel: 'Undo',
          onAction: () => {
            this.palaceManager.restoreDeletedPalace(deletedRecord);
            this.notificationManager.success(`"${palace.name}" restored`);
          },
          onDismiss: (reason) => {
            if (reason !== 'action') {
              this.syncManager?.removeCloudPalace(id);
            }
          },
        });
      },
    );
  }

  /**
   * Handle duplicate palace
   */
  handleDuplicate(id) {
    const duplicate = this.palaceManager.duplicatePalace(id);
    if (!duplicate) return;

    this.notificationManager.success(`"${duplicate.name}" created`);
  }

  /**
   * Handle export single palace
   */
  handleExportSingle(id) {
    const result = this.palaceManager.exportPalace(id);
    if (result) {
      this.uiController.downloadFile(result.blob, result.filename);
    }
  }

  /**
   * Handle export all palaces
   */
  handleExportAll() {
    const result = this.palaceManager.exportAllPalaces();
    if (result) {
      this.uiController.downloadFile(result.blob, result.filename);
      this.notificationManager.success('All palaces exported successfully');
    } else {
      this.notificationManager.warning('No palaces to export!');
    }
  }

  /**
   * Handle import palace
   */
  handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.html';
    input.onchange = (e) => {
      const target = e.target;
      if (
        !target ||
        typeof target !== 'object' ||
        !('files' in target) ||
        !target.files ||
        target.files.length === 0
      ) {
        return;
      }

      const file = target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = typeof event.target?.result === 'string' ? event.target.result : null;
          if (!text) {
            this.notificationManager.error('Error importing palace: Could not read file content');
            return;
          }

          let data;
          const isHtml =
            file.name.endsWith('.html') ||
            file.name.endsWith('.htm') ||
            HtmlPalaceParser.isPalaceHtml(text);

          if (isHtml) {
            data = HtmlPalaceParser.parse(text, file.name);
          } else {
            data = JSON.parse(text);
          }

          // Validate & sanitise at the boundary
          const items = Array.isArray(data) ? data : [data];
          const validated = items.map((item) => validatePalace(item));
          const failures = validated.filter((v) => !v.valid);
          if (failures.length > 0) {
            const msgs = failures.flatMap((f) => f.errors);
            Logger.warn('Import validation warnings', { messages: msgs });
          }
          const sanitizedData =
            validated.length === 1 ? validated[0].sanitized : validated.map((v) => v.sanitized);

          this.palaceManager.importPalaces(sanitizedData);
          this.notificationManager.success(
            isHtml ? 'HTML palace imported successfully!' : 'Palace(s) imported successfully!',
          );
        } catch (err) {
          this.notificationManager.error('Error importing palace: Invalid file format');
          Logger.error('Import failed', { error: String(err) });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
}
