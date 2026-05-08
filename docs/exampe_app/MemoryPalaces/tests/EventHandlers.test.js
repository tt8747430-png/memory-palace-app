import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Logger
vi.mock('../src/js/modules/Logger.js', () => ({
  Logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock HtmlPalaceParser
vi.mock('../src/js/modules/HtmlPalaceParser.js', () => ({
  HtmlPalaceParser: {
    isPalaceHtml: vi.fn(() => false),
    parse: vi.fn(() => ({ name: 'Parsed', location: 'Loc' })),
  },
}));

// Mock validation
vi.mock('../src/js/modules/validation.js', () => ({
  validatePalace: vi.fn((data) => ({ valid: true, errors: [], sanitized: data })),
}));

import { EventHandlers } from '../src/js/modules/EventHandlers.js';
import { HtmlPalaceParser } from '../src/js/modules/HtmlPalaceParser.js';
import { validatePalace } from '../src/js/modules/validation.js';
import { Logger } from '../src/js/modules/Logger.js';

// Create stubbed DOM elements
const stubElement = (overrides = {}) => ({
  addEventListener: vi.fn(),
  classList: { add: vi.fn(), remove: vi.fn() },
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  innerHTML: '',
  textContent: '',
  value: '',
  options: [],
  selectedOptions: [],
  focus: vi.fn(),
  ...overrides,
});

const elements = {};
vi.spyOn(document, 'getElementById').mockImplementation((id) => {
  if (!elements[id]) elements[id] = stubElement();
  return elements[id];
});
vi.spyOn(document, 'addEventListener').mockImplementation(vi.fn());
vi.spyOn(document, 'createElement').mockImplementation((tag) => {
  return stubElement({ tagName: tag, click: vi.fn(), type: '', accept: '', onchange: null });
});

describe('EventHandlers', () => {
  let eh;
  const mockPalaceManager = {
    getAllPalaces: vi.fn(() => []),
    getPalaceById: vi.fn(() => null),
    createPalace: vi.fn(() => ({ id: 'new-1', name: 'New' })),
    updatePalace: vi.fn(),
    deletePalace: vi.fn(),
    duplicatePalace: vi.fn(),
    exportPalace: vi.fn(),
    exportAllPalaces: vi.fn(),
    importPalaces: vi.fn(),
    restoreDeletedPalace: vi.fn(),
  };
  const mockUIController = {
    openNewPalaceModal: vi.fn(),
    openEditPalaceModal: vi.fn(),
    showPractice: vi.fn(),
    hidePractice: vi.fn(),
    showStatistics: vi.fn(),
    hideStatistics: vi.fn(),
    showJourney: vi.fn(),
    hideJourney: vi.fn(),
    hideModal: vi.fn(),
    openStationEditor: vi.fn(),
    hideStationEditor: vi.fn(),
    clearStationForm: vi.fn(),
    saveStation: vi.fn(),
    renderPalaces: vi.fn(),
    setFilter: vi.fn(),
    setSort: vi.fn(),
    getCurrentFilter: vi.fn(() => ''),
    getCurrentSort: vi.fn(() => 'updated'),
    getCurrentEditId: vi.fn(() => null),
    downloadFile: vi.fn(),
  };
  const mockThemeManager = {
    toggleTheme: vi.fn(() => 'dark'),
    currentTheme: 'auto',
  };
  const mockNotificationManager = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    confirm: vi.fn(),
    show: vi.fn(),
  };
  const mockSyncManager = {
    isConfigured: false,
    isReady: false,
    initFailed: false,
    isSignedIn: vi.fn(() => false),
    getUserInfo: vi.fn(() => null),
    signIn: vi.fn(),
    signOut: vi.fn(),
    removeCloudPalace: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(elements).forEach((k) => delete elements[k]);
    eh = new EventHandlers(
      mockPalaceManager,
      mockUIController,
      mockThemeManager,
      mockNotificationManager,
      mockSyncManager,
    );
  });

  describe('init', () => {
    it('calls all setup methods', () => {
      const spy1 = vi.spyOn(eh, 'setupToolbarEvents').mockImplementation(() => {});
      const spy2 = vi.spyOn(eh, 'setupModalEvents').mockImplementation(() => {});
      const spy3 = vi.spyOn(eh, 'setupFormEvents').mockImplementation(() => {});
      const spy4 = vi.spyOn(eh, 'setupGridEvents').mockImplementation(() => {});
      const spy5 = vi.spyOn(eh, 'setupKeyboardShortcuts').mockImplementation(() => {});
      const spy6 = vi.spyOn(eh, 'setupMobileNavEvents').mockImplementation(() => {});
      const spy7 = vi.spyOn(eh, 'setupUtilityUiEvents').mockImplementation(() => {});

      eh.init();
      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      expect(spy3).toHaveBeenCalled();
      expect(spy4).toHaveBeenCalled();
      expect(spy5).toHaveBeenCalled();
      expect(spy6).toHaveBeenCalled();
      expect(spy7).toHaveBeenCalled();
    });
  });

  describe('setupToolbarEvents', () => {
    it('attaches click handler for newPalaceBtn', () => {
      eh.setupToolbarEvents();
      const handler = elements['newPalaceBtn'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      expect(handler).toBeTruthy();
      handler[1]();
      expect(mockUIController.openNewPalaceModal).toHaveBeenCalled();
    });

    it('attaches click handler for importBtn', () => {
      eh.setupToolbarEvents();
      const handler = elements['importBtn'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      expect(handler).toBeTruthy();
      const spy = vi.spyOn(eh, 'handleImport').mockImplementation(() => {});
      handler[1]();
      expect(spy).toHaveBeenCalled();
    });

    it('attaches click handler for exportAllBtn', () => {
      eh.setupToolbarEvents();
      const handler = elements['exportAllBtn'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      expect(handler).toBeTruthy();
      const spy = vi.spyOn(eh, 'handleExportAll').mockImplementation(() => {});
      handler[1]();
      expect(spy).toHaveBeenCalled();
    });

    it('attaches click handler for practiceBtn', () => {
      eh.setupToolbarEvents();
      const handler = elements['practiceBtn'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      expect(handler).toBeTruthy();
      handler[1]();
      expect(mockUIController.showPractice).toHaveBeenCalled();
    });

    it('attaches click handler for statsBtn', () => {
      eh.setupToolbarEvents();
      const handler = elements['statsBtn'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      expect(handler).toBeTruthy();
      handler[1]();
      expect(mockUIController.showStatistics).toHaveBeenCalled();
    });

    it('attaches click handler for themeToggle', () => {
      eh.setupToolbarEvents();
      const handler = elements['themeToggle'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]();
      expect(mockThemeManager.toggleTheme).toHaveBeenCalled();
    });

    it('handles missing themeManager on toggle', () => {
      const ehNoTheme = new EventHandlers(
        mockPalaceManager,
        mockUIController,
        null,
        mockNotificationManager,
      );
      ehNoTheme.setupToolbarEvents();
      const handler = elements['themeToggle'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]();
      expect(Logger.error).toHaveBeenCalledWith('Theme manager not initialized');
    });

    it('attaches handler for searchInput', () => {
      eh.setupToolbarEvents();
      const handler = elements['searchInput'].addEventListener.mock.calls.find(
        (c) => c[0] === 'input',
      );
      handler[1]({ target: { value: 'test' } });
      expect(mockUIController.setFilter).toHaveBeenCalledWith('test');
    });

    it('attaches handler for sortSelect', () => {
      eh.setupToolbarEvents();
      const handler = elements['sortSelect'].addEventListener.mock.calls.find(
        (c) => c[0] === 'change',
      );
      handler[1]({ target: { value: 'name' } });
      expect(mockUIController.setSort).toHaveBeenCalledWith('name');
    });

    it('attaches handler for syncBtn', () => {
      eh.setupToolbarEvents();
      const handler = elements['syncBtn'].addEventListener.mock.calls.find((c) => c[0] === 'click');
      expect(handler).toBeTruthy();
    });
  });

  describe('setupModalEvents', () => {
    it('attaches close handlers for all modals', () => {
      eh.setupModalEvents();
      // closeModalBtn click
      const handler = elements['closeModalBtn'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]();
      expect(mockUIController.hideModal).toHaveBeenCalled();
    });

    it('attaches cancel button handler', () => {
      eh.setupModalEvents();
      const handler = elements['cancelBtn'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]();
      expect(mockUIController.hideModal).toHaveBeenCalled();
    });

    it('attaches close stats button handler', () => {
      eh.setupModalEvents();
      const handler = elements['closeStatsBtn'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]();
      expect(mockUIController.hideStatistics).toHaveBeenCalled();
    });

    it('attaches close practice button handler', () => {
      eh.setupModalEvents();
      const handler = elements['closePracticeBtn'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]();
      expect(mockUIController.hidePractice).toHaveBeenCalled();
    });

    it('attaches close journey button handler', () => {
      eh.setupModalEvents();
      const handler = elements['closeJourneyBtn'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]();
      expect(mockUIController.hideJourney).toHaveBeenCalled();
    });

    it('closes palace modal on outside click', () => {
      eh.setupModalEvents();
      const handler = elements['palaceModal'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]({ target: { id: 'palaceModal' } });
      expect(mockUIController.hideModal).toHaveBeenCalled();
    });

    it('does not close palace modal on inside click', () => {
      eh.setupModalEvents();
      const handler = elements['palaceModal'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      mockUIController.hideModal.mockClear();
      handler[1]({ target: { id: 'innerElement' } });
      expect(mockUIController.hideModal).not.toHaveBeenCalled();
    });

    it('closes stats modal on outside click', () => {
      eh.setupModalEvents();
      const handler = elements['statsModal'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]({ target: { id: 'statsModal' } });
      expect(mockUIController.hideStatistics).toHaveBeenCalled();
    });

    it('closes practice modal on outside click', () => {
      eh.setupModalEvents();
      const handler = elements['practiceModal'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]({ target: { id: 'practiceModal' } });
      expect(mockUIController.hidePractice).toHaveBeenCalled();
    });

    it('closes journey modal on outside click', () => {
      eh.setupModalEvents();
      const handler = elements['journeyModal'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]({ target: { id: 'journeyModal' } });
      expect(mockUIController.hideJourney).toHaveBeenCalled();
    });

    it('closes station editor modal on outside click', () => {
      eh.setupModalEvents();
      const handler = elements['stationEditorModal'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]({ target: { id: 'stationEditorModal' } });
      expect(mockUIController.hideStationEditor).toHaveBeenCalled();
    });

    it('attaches close station editor button handler', () => {
      eh.setupModalEvents();
      const handler = elements['closeStationEditorBtn'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]();
      expect(mockUIController.hideStationEditor).toHaveBeenCalled();
    });

    it('attaches cancel station button handler', () => {
      eh.setupModalEvents();
      const handler = elements['cancelStationBtn'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]();
      expect(mockUIController.clearStationForm).toHaveBeenCalled();
    });

    it('attaches add new station button handler', () => {
      eh.setupModalEvents();
      const handler = elements['addNewStationBtn'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );
      handler[1]();
      expect(mockUIController.clearStationForm).toHaveBeenCalled();
    });

    it('attaches submit handler for stationForm', () => {
      eh.setupModalEvents();
      const handler = elements['stationForm'].addEventListener.mock.calls.find(
        (c) => c[0] === 'submit',
      );
      handler[1]({ preventDefault: vi.fn() });
      expect(mockUIController.saveStation).toHaveBeenCalled();
    });
  });

  describe('setupFormEvents', () => {
    it('attaches submit handler for palaceForm', () => {
      const spy = vi.spyOn(eh, 'handleSavePalace').mockImplementation(() => {});
      eh.setupFormEvents();
      const handler = elements['palaceForm'].addEventListener.mock.calls.find(
        (c) => c[0] === 'submit',
      );
      handler[1]({ preventDefault: vi.fn() });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('setupGridEvents', () => {
    it('handles edit button click in palace card', () => {
      eh.setupGridEvents();
      const handler = elements['palacesGrid'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );

      const card = { dataset: { id: 'p1' } };
      handler[1]({
        target: {
          closest: vi.fn((sel) =>
            sel === '.palace-card' ? card : sel === '.edit-btn' ? {} : null,
          ),
        },
        stopPropagation: vi.fn(),
      });
      expect(mockUIController.openEditPalaceModal).toHaveBeenCalledWith('p1');
    });

    it('handles export button click', () => {
      const spy = vi.spyOn(eh, 'handleExportSingle').mockImplementation(() => {});
      eh.setupGridEvents();
      const handler = elements['palacesGrid'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );

      const card = { dataset: { id: 'p1' } };
      handler[1]({
        target: {
          closest: vi.fn((sel) =>
            sel === '.palace-card' ? card : sel === '.export-btn' ? {} : null,
          ),
        },
        stopPropagation: vi.fn(),
      });
      expect(spy).toHaveBeenCalledWith('p1');
    });

    it('handles delete button click', () => {
      const spy = vi.spyOn(eh, 'handleDelete').mockImplementation(() => {});
      eh.setupGridEvents();
      const handler = elements['palacesGrid'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );

      const card = { dataset: { id: 'p1' } };
      handler[1]({
        target: {
          closest: vi.fn((sel) =>
            sel === '.palace-card' ? card : sel === '.delete-btn' ? {} : null,
          ),
        },
        stopPropagation: vi.fn(),
      });
      expect(spy).toHaveBeenCalledWith('p1');
    });

    it('handles duplicate button click', () => {
      const spy = vi.spyOn(eh, 'handleDuplicate').mockImplementation(() => {});
      eh.setupGridEvents();
      const handler = elements['palacesGrid'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );

      const card = { dataset: { id: 'p1' } };
      handler[1]({
        target: {
          closest: vi.fn((sel) =>
            sel === '.palace-card' ? card : sel === '.duplicate-btn' ? {} : null,
          ),
        },
        stopPropagation: vi.fn(),
      });
      expect(spy).toHaveBeenCalledWith('p1');
    });

    it('handles journey button click with stations', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ detailedStations: [{ number: 1 }] });
      eh.setupGridEvents();
      const handler = elements['palacesGrid'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );

      const card = { dataset: { id: 'p1' } };
      handler[1]({
        target: {
          closest: vi.fn((sel) =>
            sel === '.palace-card' ? card : sel === '.journey-btn' ? {} : null,
          ),
        },
        stopPropagation: vi.fn(),
      });
      expect(mockUIController.showJourney).toHaveBeenCalledWith('p1');
    });

    it('handles journey button click without stations (offers to add)', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ detailedStations: [] });
      eh.setupGridEvents();
      const handler = elements['palacesGrid'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );

      const card = { dataset: { id: 'p1' } };
      handler[1]({
        target: {
          closest: vi.fn((sel) =>
            sel === '.palace-card' ? card : sel === '.journey-btn' ? {} : null,
          ),
        },
        stopPropagation: vi.fn(),
      });
      expect(mockNotificationManager.confirm).toHaveBeenCalled();

      // Exercise the confirm callback (line 231)
      const confirmCb = mockNotificationManager.confirm.mock.calls[0][1];
      confirmCb();
      expect(mockUIController.openStationEditor).toHaveBeenCalledWith('p1');
    });

    it('handles stations button click', () => {
      eh.setupGridEvents();
      const handler = elements['palacesGrid'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );

      const card = { dataset: { id: 'p1' } };
      handler[1]({
        target: {
          closest: vi.fn((sel) =>
            sel === '.palace-card' ? card : sel === '.stations-btn' ? {} : null,
          ),
        },
        stopPropagation: vi.fn(),
      });
      expect(mockUIController.openStationEditor).toHaveBeenCalledWith('p1');
    });

    it('handles card body click (edit)', () => {
      eh.setupGridEvents();
      const handler = elements['palacesGrid'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );

      const card = { dataset: { id: 'p1' } };
      handler[1]({
        target: { closest: vi.fn((sel) => (sel === '.palace-card' ? card : null)) },
        stopPropagation: vi.fn(),
      });
      expect(mockUIController.openEditPalaceModal).toHaveBeenCalledWith('p1');
    });

    it('ignores clicks on palace-actions area (non-button)', () => {
      eh.setupGridEvents();
      const handler = elements['palacesGrid'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );

      const card = { dataset: { id: 'p1' } };
      handler[1]({
        target: {
          closest: vi.fn((sel) =>
            sel === '.palace-card' ? card : sel === '.palace-actions' ? {} : null,
          ),
        },
        stopPropagation: vi.fn(),
      });
      // openEditPalaceModal should NOT be called from card body
      expect(mockUIController.openEditPalaceModal).not.toHaveBeenCalled();
    });

    it('ignores click when no palace card found', () => {
      eh.setupGridEvents();
      const handler = elements['palacesGrid'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      );

      handler[1]({
        target: { closest: vi.fn(() => null) },
        stopPropagation: vi.fn(),
      });
    });
  });

  describe('setupKeyboardShortcuts', () => {
    it('handles Escape to close all modals', () => {
      eh.setupKeyboardShortcuts();
      const handler = document.addEventListener.mock.calls.find((c) => c[0] === 'keydown');
      handler[1]({ key: 'Escape' });
      expect(mockUIController.hideModal).toHaveBeenCalled();
      expect(mockUIController.hideStatistics).toHaveBeenCalled();
    });

    it('handles Ctrl+N for new palace', () => {
      eh.setupKeyboardShortcuts();
      const handler = document.addEventListener.mock.calls.find((c) => c[0] === 'keydown');
      handler[1]({ key: 'n', ctrlKey: true, preventDefault: vi.fn() });
      expect(mockUIController.openNewPalaceModal).toHaveBeenCalled();
    });

    it('handles Cmd+P for practice', () => {
      eh.setupKeyboardShortcuts();
      const handler = document.addEventListener.mock.calls.find((c) => c[0] === 'keydown');
      handler[1]({ key: 'p', metaKey: true, preventDefault: vi.fn() });
      expect(mockUIController.showPractice).toHaveBeenCalled();
    });

    it('handles Ctrl+K for stats', () => {
      eh.setupKeyboardShortcuts();
      const handler = document.addEventListener.mock.calls.find((c) => c[0] === 'keydown');
      handler[1]({ key: 'k', ctrlKey: true, preventDefault: vi.fn() });
      expect(mockUIController.showStatistics).toHaveBeenCalled();
    });

    it('handles / to focus search', () => {
      elements['searchInput'] = stubElement();
      eh.setupKeyboardShortcuts();
      const handler = document.addEventListener.mock.calls.find((c) => c[0] === 'keydown');
      handler[1]({ key: '/', target: { tagName: 'BODY' }, preventDefault: vi.fn() });
      expect(elements['searchInput'].focus).toHaveBeenCalled();
    });

    it('does not focus search when typing in input', () => {
      eh.setupKeyboardShortcuts();
      const handler = document.addEventListener.mock.calls.find((c) => c[0] === 'keydown');
      handler[1]({ key: '/', target: { tagName: 'INPUT' }, preventDefault: vi.fn() });
      // Should not have called focus since we're in an input
    });

    it('handles Ctrl+Shift+Backspace to clear search', () => {
      eh.setupKeyboardShortcuts();
      const handler = document.addEventListener.mock.calls.find((c) => c[0] === 'keydown');
      handler[1]({ key: 'Backspace', ctrlKey: true, shiftKey: true, preventDefault: vi.fn() });
      expect(mockUIController.setFilter).toHaveBeenCalledWith('');
    });
  });

  describe('handleSavePalace', () => {
    it('creates a new palace when no editId', () => {
      mockUIController.getCurrentEditId.mockReturnValue(null);
      // Pre-create elements via getElementById mock
      document.getElementById('palaceName').value = 'New Palace';
      document.getElementById('palaceLocation').value = 'Location';
      document.getElementById('palaceDescription').value = 'Desc';
      document.getElementById('palaceBook').value = 'Book';
      document.getElementById('palaceChapter').value = 'Ch';
      document.getElementById('palaceStations').value = '5';
      document.getElementById('palaceVerses').value = '10';
      document.getElementById('palaceTags').value = 'tag1, tag2';
      document.getElementById('palaceNotes').value = 'Notes';
      document.getElementById('palaceConnections').selectedOptions = [];

      eh.handleSavePalace();
      expect(mockPalaceManager.createPalace).toHaveBeenCalled();
      expect(mockNotificationManager.success).toHaveBeenCalledWith('Palace created successfully');
    });

    it('updates existing palace when editId is set', () => {
      mockUIController.getCurrentEditId.mockReturnValue('p1');
      document.getElementById('palaceName').value = 'Updated';
      document.getElementById('palaceLocation').value = 'L';
      document.getElementById('palaceDescription').value = '';
      document.getElementById('palaceBook').value = '';
      document.getElementById('palaceChapter').value = '';
      document.getElementById('palaceStations').value = '';
      document.getElementById('palaceVerses').value = '';
      document.getElementById('palaceTags').value = '';
      document.getElementById('palaceNotes').value = '';
      document.getElementById('palaceConnections').selectedOptions = [];

      eh.handleSavePalace();
      expect(mockPalaceManager.updatePalace).toHaveBeenCalledWith('p1', expect.anything());
      expect(mockNotificationManager.success).toHaveBeenCalledWith('Palace updated successfully');
    });
  });

  describe('handleDelete', () => {
    it('does nothing when palace not found', () => {
      mockPalaceManager.getPalaceById.mockReturnValue(null);
      eh.handleDelete('bad-id');
      expect(mockNotificationManager.confirm).not.toHaveBeenCalled();
    });

    it('shows confirmation dialog', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Test' });
      eh.handleDelete('p1');
      expect(mockNotificationManager.confirm).toHaveBeenCalled();
    });

    it('deletes and shows undo on confirm', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Test' });
      mockPalaceManager.deletePalace.mockReturnValue({
        palace: { id: 'p1', name: 'Test' },
        affectedPalaceIds: [],
      });

      eh.handleDelete('p1');
      // Call the confirm callback
      const confirmCb = mockNotificationManager.confirm.mock.calls[0][1];
      confirmCb();
      expect(mockPalaceManager.deletePalace).toHaveBeenCalledWith('p1', { skipSync: true });
      expect(mockNotificationManager.show).toHaveBeenCalled();
    });

    it('handles undo action in delete toast', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Test' });
      const deletedRecord = { palace: { id: 'p1', name: 'Test' }, affectedPalaceIds: [] };
      mockPalaceManager.deletePalace.mockReturnValue(deletedRecord);

      eh.handleDelete('p1');
      const confirmCb = mockNotificationManager.confirm.mock.calls[0][1];
      confirmCb();

      // Get the show() call and exercise onAction
      const showCall = mockNotificationManager.show.mock.calls[0];
      const options = showCall[3];
      options.onAction();
      expect(mockPalaceManager.restoreDeletedPalace).toHaveBeenCalledWith(deletedRecord);
    });

    it('handles dismiss without undo (syncs deletion)', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Test' });
      mockPalaceManager.deletePalace.mockReturnValue({
        palace: { id: 'p1', name: 'Test' },
        affectedPalaceIds: [],
      });

      eh.handleDelete('p1');
      const confirmCb = mockNotificationManager.confirm.mock.calls[0][1];
      confirmCb();

      const showCall = mockNotificationManager.show.mock.calls[0];
      const options = showCall[3];
      options.onDismiss('timeout');
      expect(mockSyncManager.removeCloudPalace).toHaveBeenCalledWith('p1');
    });

    it('does not sync on undo dismiss', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Test' });
      mockPalaceManager.deletePalace.mockReturnValue({
        palace: { id: 'p1', name: 'Test' },
        affectedPalaceIds: [],
      });

      eh.handleDelete('p1');
      const confirmCb = mockNotificationManager.confirm.mock.calls[0][1];
      confirmCb();

      const showCall = mockNotificationManager.show.mock.calls[0];
      const options = showCall[3];
      options.onDismiss('action');
      expect(mockSyncManager.removeCloudPalace).not.toHaveBeenCalled();
    });

    it('handles deletePalace returning null', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Test' });
      mockPalaceManager.deletePalace.mockReturnValue(null);

      eh.handleDelete('p1');
      const confirmCb = mockNotificationManager.confirm.mock.calls[0][1];
      confirmCb();
      expect(mockNotificationManager.show).not.toHaveBeenCalled();
    });
  });

  describe('handleDuplicate', () => {
    it('shows success on duplicate', () => {
      mockPalaceManager.duplicatePalace.mockReturnValue({ name: 'Copy' });
      eh.handleDuplicate('p1');
      expect(mockNotificationManager.success).toHaveBeenCalledWith('"Copy" created');
    });

    it('does nothing when duplicate fails', () => {
      mockPalaceManager.duplicatePalace.mockReturnValue(null);
      eh.handleDuplicate('p1');
      expect(mockNotificationManager.success).not.toHaveBeenCalled();
    });
  });

  describe('handleExportSingle', () => {
    it('downloads file on success', () => {
      mockPalaceManager.exportPalace.mockReturnValue({ blob: new Blob(), filename: 'test.json' });
      eh.handleExportSingle('p1');
      expect(mockUIController.downloadFile).toHaveBeenCalled();
    });

    it('does nothing when export fails', () => {
      mockPalaceManager.exportPalace.mockReturnValue(null);
      eh.handleExportSingle('p1');
      expect(mockUIController.downloadFile).not.toHaveBeenCalled();
    });
  });

  describe('handleExportAll', () => {
    it('downloads file and shows success', () => {
      mockPalaceManager.exportAllPalaces.mockReturnValue({
        blob: new Blob(),
        filename: 'all.json',
      });
      eh.handleExportAll();
      expect(mockUIController.downloadFile).toHaveBeenCalled();
      expect(mockNotificationManager.success).toHaveBeenCalled();
    });

    it('shows warning when no palaces', () => {
      mockPalaceManager.exportAllPalaces.mockReturnValue(null);
      eh.handleExportAll();
      expect(mockNotificationManager.warning).toHaveBeenCalledWith('No palaces to export!');
    });
  });

  describe('handleImport', () => {
    const installFileReaderMock = () => {
      let onloadCb = () => {};
      class MockFileReader {
        readAsText() {}
        set onload(fn) {
          onloadCb = fn;
        }
        get onload() {
          return onloadCb;
        }
      }
      vi.stubGlobal('FileReader', MockFileReader);
      return (result) => onloadCb({ target: { result } });
    };

    it('creates file input and triggers click', () => {
      eh.handleImport();
      const input = document.createElement.mock.results[0].value;
      expect(input.type).toBe('file');
      expect(input.click).toHaveBeenCalled();
    });

    it('handles empty file selection', () => {
      eh.handleImport();
      const input = document.createElement.mock.results[0].value;
      input.onchange({ target: { files: [] } });
    });

    it('handles null target', () => {
      eh.handleImport();
      const input = document.createElement.mock.results[0].value;
      input.onchange({ target: null });
    });

    it('handles missing files property', () => {
      eh.handleImport();
      const input = document.createElement.mock.results[0].value;
      input.onchange({ target: { other: true } });
    });

    it('reads and imports JSON file', async () => {
      const triggerRead = installFileReaderMock();

      eh.handleImport();
      const input = document.createElement.mock.results[0].value;

      const file = { name: 'test.json', type: 'application/json' };
      input.onchange({ target: { files: [file] } });

      // Simulate file read complete
      triggerRead('{"name":"Test","location":"L"}');
      expect(mockPalaceManager.importPalaces).toHaveBeenCalled();
      expect(mockNotificationManager.success).toHaveBeenCalledWith(
        'Palace(s) imported successfully!',
      );

      vi.unstubAllGlobals();
    });

    it('reads and imports HTML file', async () => {
      const triggerRead = installFileReaderMock();

      HtmlPalaceParser.isPalaceHtml.mockReturnValue(false);

      eh.handleImport();
      const input = document.createElement.mock.results[0].value;

      const file = { name: 'palace.html' };
      input.onchange({ target: { files: [file] } });

      triggerRead('<html lang="en">palace</html>');
      expect(HtmlPalaceParser.parse).toHaveBeenCalled();
      expect(mockNotificationManager.success).toHaveBeenCalledWith(
        'HTML palace imported successfully!',
      );

      vi.unstubAllGlobals();
    });

    it('handles import with validation warnings', async () => {
      const triggerRead = installFileReaderMock();

      validatePalace.mockReturnValue({
        valid: false,
        errors: ['name is required'],
        sanitized: { name: '', location: '' },
      });

      eh.handleImport();
      const input = document.createElement.mock.results[0].value;
      input.onchange({ target: { files: [{ name: 'test.json' }] } });
      triggerRead('{"location":"L"}');

      expect(Logger.warn).toHaveBeenCalledWith('Import validation warnings', expect.any(Object));
      vi.unstubAllGlobals();
    });

    it('handles import array of palaces', async () => {
      const triggerRead = installFileReaderMock();

      eh.handleImport();
      const input = document.createElement.mock.results[0].value;
      input.onchange({ target: { files: [{ name: 'all.json' }] } });
      triggerRead('[{"name":"A","location":"X"},{"name":"B","location":"Y"}]');

      expect(mockPalaceManager.importPalaces).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('handles import error (invalid JSON)', async () => {
      const triggerRead = installFileReaderMock();

      eh.handleImport();
      const input = document.createElement.mock.results[0].value;
      input.onchange({ target: { files: [{ name: 'bad.json' }] } });
      triggerRead('not valid json{{{');

      expect(mockNotificationManager.error).toHaveBeenCalledWith(
        'Error importing palace: Invalid file format',
      );
      vi.unstubAllGlobals();
    });

    it('handles null file content', async () => {
      const triggerRead = installFileReaderMock();

      eh.handleImport();
      const input = document.createElement.mock.results[0].value;
      input.onchange({ target: { files: [{ name: 'test.json' }] } });
      triggerRead(null);

      expect(mockNotificationManager.error).toHaveBeenCalledWith(
        'Error importing palace: Could not read file content',
      );
      vi.unstubAllGlobals();
    });

    it('handles HTML detected via isPalaceHtml', async () => {
      const triggerRead = installFileReaderMock();

      HtmlPalaceParser.isPalaceHtml.mockReturnValue(true);

      eh.handleImport();
      const input = document.createElement.mock.results[0].value;
      input.onchange({ target: { files: [{ name: 'test.txt' }] } });
      triggerRead('<html lang="en">palace content</html>');

      expect(HtmlPalaceParser.parse).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('handles null first file', () => {
      eh.handleImport();
      const input = document.createElement.mock.results[0].value;
      input.onchange({ target: { files: [null] } });
    });
  });

  describe('handleSyncClick', () => {
    it('shows info when not configured', async () => {
      mockSyncManager.isConfigured = false;
      await eh.handleSyncClick();
      expect(mockNotificationManager.info).toHaveBeenCalledWith(
        expect.stringContaining('not configured'),
      );
    });

    it('shows error when initFailed', async () => {
      mockSyncManager.isConfigured = true;
      mockSyncManager.initFailed = true;
      await eh.handleSyncClick();
      expect(mockNotificationManager.error).toHaveBeenCalledWith(
        expect.stringContaining('failed to initialize'),
      );
    });

    it('shows info when not ready', async () => {
      mockSyncManager.isConfigured = true;
      mockSyncManager.initFailed = false;
      mockSyncManager.isReady = false;
      await eh.handleSyncClick();
      expect(mockNotificationManager.info).toHaveBeenCalledWith(
        expect.stringContaining('initializing'),
      );
    });

    it('offers sign-out when already signed in', async () => {
      mockSyncManager.isConfigured = true;
      mockSyncManager.initFailed = false;
      mockSyncManager.isReady = true;
      mockSyncManager.isSignedIn.mockReturnValue(true);
      mockSyncManager.getUserInfo.mockReturnValue({ name: 'User', email: 'user@test.com' });

      await eh.handleSyncClick();
      expect(mockNotificationManager.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Sign out'),
        expect.any(Function),
      );
    });

    it('signs out when confirm callback is called', async () => {
      mockSyncManager.isConfigured = true;
      mockSyncManager.initFailed = false;
      mockSyncManager.isReady = true;
      mockSyncManager.isSignedIn.mockReturnValue(true);
      mockSyncManager.getUserInfo.mockReturnValue({ name: 'User', email: 'e@e.com' });
      mockSyncManager.signOut.mockResolvedValue();

      await eh.handleSyncClick();
      const cb = mockNotificationManager.confirm.mock.calls[0][1];
      await cb();
      expect(mockSyncManager.signOut).toHaveBeenCalled();
    });

    it('initiates sign-in when not signed in', async () => {
      mockSyncManager.isConfigured = true;
      mockSyncManager.initFailed = false;
      mockSyncManager.isReady = true;
      mockSyncManager.isSignedIn.mockReturnValue(false);
      mockSyncManager.signIn.mockResolvedValue();

      await eh.handleSyncClick();
      expect(mockSyncManager.signIn).toHaveBeenCalled();
    });

    it('handles popup-closed sign-in error', async () => {
      mockSyncManager.isConfigured = true;
      mockSyncManager.initFailed = false;
      mockSyncManager.isReady = true;
      mockSyncManager.isSignedIn.mockReturnValue(false);
      mockSyncManager.signIn.mockRejectedValue({ code: 'auth/popup-closed-by-user' });

      await eh.handleSyncClick();
      expect(mockNotificationManager.warning).toHaveBeenCalledWith(
        expect.stringContaining('canceled'),
      );
    });

    it('handles general sign-in error', async () => {
      mockSyncManager.isConfigured = true;
      mockSyncManager.initFailed = false;
      mockSyncManager.isReady = true;
      mockSyncManager.isSignedIn.mockReturnValue(false);
      mockSyncManager.signIn.mockRejectedValue({ code: 'auth/unknown' });

      await eh.handleSyncClick();
      expect(mockNotificationManager.error).toHaveBeenCalledWith(expect.stringContaining('failed'));
    });

    it('handles sync with no syncManager', async () => {
      const ehNoSync = new EventHandlers(
        mockPalaceManager,
        mockUIController,
        mockThemeManager,
        mockNotificationManager,
        null,
      );
      await ehNoSync.handleSyncClick();
      expect(mockNotificationManager.info).toHaveBeenCalledWith(
        expect.stringContaining('not configured'),
      );
    });
  });

  describe('setupMobileNavEvents', () => {
    it('returns early when hamburger or drawer is missing', () => {
      vi.spyOn(document, 'getElementById').mockImplementation((id) => {
        if (id === 'hamburgerBtn') return null;
        if (id === 'mobileNavDrawer') return null;
        if (!elements[id]) elements[id] = stubElement();
        return elements[id];
      });
      expect(() => eh.setupMobileNavEvents()).not.toThrow();
    });

    it('attaches click handler to hamburger button', () => {
      const drawer = stubElement({
        classList: { contains: vi.fn(() => false), add: vi.fn(), remove: vi.fn() },
      });
      const btn = stubElement();
      vi.spyOn(document, 'getElementById').mockImplementation((id) => {
        if (id === 'hamburgerBtn') return btn;
        if (id === 'mobileNavDrawer') return drawer;
        if (!elements[id]) elements[id] = stubElement();
        return elements[id];
      });
      eh.setupMobileNavEvents();
      expect(btn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('attaches click delegation to drawer', () => {
      const drawer = stubElement({
        classList: { contains: vi.fn(() => false), add: vi.fn(), remove: vi.fn() },
      });
      const btn = stubElement();
      vi.spyOn(document, 'getElementById').mockImplementation((id) => {
        if (id === 'hamburgerBtn') return btn;
        if (id === 'mobileNavDrawer') return drawer;
        if (!elements[id]) elements[id] = stubElement();
        return elements[id];
      });
      eh.setupMobileNavEvents();
      expect(drawer.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('openMobileNav / closeMobileNav', () => {
    it('openMobileNav adds open class and sets aria', () => {
      const drawer = stubElement({ classList: { add: vi.fn(), remove: vi.fn() } });
      const btn = stubElement({ classList: { add: vi.fn(), remove: vi.fn() } });
      vi.spyOn(document, 'getElementById').mockImplementation((id) => {
        if (id === 'hamburgerBtn') return btn;
        if (id === 'mobileNavDrawer') return drawer;
        return stubElement();
      });
      eh.openMobileNav();
      expect(drawer.classList.add).toHaveBeenCalledWith('open');
      expect(drawer.setAttribute).toHaveBeenCalledWith('aria-hidden', 'false');
      expect(btn.classList.add).toHaveBeenCalledWith('active');
      expect(btn.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');
    });

    it('closeMobileNav removes open class and resets aria', () => {
      const drawer = stubElement({ classList: { add: vi.fn(), remove: vi.fn() } });
      const btn = stubElement({ classList: { add: vi.fn(), remove: vi.fn() } });
      vi.spyOn(document, 'getElementById').mockImplementation((id) => {
        if (id === 'hamburgerBtn') return btn;
        if (id === 'mobileNavDrawer') return drawer;
        return stubElement();
      });
      eh.closeMobileNav();
      expect(drawer.classList.remove).toHaveBeenCalledWith('open');
      expect(drawer.setAttribute).toHaveBeenCalledWith('inert', '');
      expect(drawer.setAttribute).toHaveBeenCalledWith('aria-hidden', 'true');
      expect(btn.classList.remove).toHaveBeenCalledWith('active');
      expect(btn.setAttribute).toHaveBeenCalledWith('aria-expanded', 'false');
    });
  });
});
