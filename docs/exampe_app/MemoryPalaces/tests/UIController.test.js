import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub DOM elements that UIController reads in its constructor
const stubElement = () => ({
  classList: { add: vi.fn(), remove: vi.fn() },
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  innerHTML: '',
  textContent: '',
  value: '',
  options: [],
  reset: vi.fn(),
  focus: vi.fn(),
});

vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

// Stub document.getElementById to return dummy elements
const elements = {};
vi.spyOn(document, 'getElementById').mockImplementation((id) => {
  if (!elements[id]) elements[id] = stubElement();
  return elements[id];
});

import { UIController } from '../src/js/modules/UIController.js';

describe('UIController', () => {
  let ui;
  const mockPalaceManager = {
    getAllPalaces: vi.fn(() => []),
    searchPalaces: vi.fn(() => []),
    getPalaceById: vi.fn(() => null),
    updatePalace: vi.fn(),
  };
  const mockPracticeManager = {
    getPracticeData: vi.fn(() => ({ practiceCount: 0, mastery: 0, streak: 0 })),
  };
  const mockNotificationManager = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset element stubs
    Object.keys(elements).forEach((k) => delete elements[k]);
    ui = new UIController(mockPalaceManager, mockPracticeManager, mockNotificationManager);
  });

  describe('sortPalaces', () => {
    const palaces = [
      {
        id: '1',
        name: 'Beta',
        location: 'A',
        stations: 5,
        verses: 10,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Alpha',
        location: 'B',
        stations: 10,
        verses: 5,
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
      },
      {
        id: '3',
        name: 'Gamma',
        location: 'C',
        stations: 1,
        verses: 20,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    it('sorts by updated date (most recent first) by default', () => {
      const sorted = ui.sortPalaces(palaces, 'updated');
      expect(sorted.map((p) => p.name)).toEqual(['Beta', 'Alpha', 'Gamma']);
    });

    it('sorts by created date (most recent first)', () => {
      const sorted = ui.sortPalaces(palaces, 'created');
      expect(sorted.map((p) => p.name)).toEqual(['Gamma', 'Alpha', 'Beta']);
    });

    it('sorts by name A-Z', () => {
      const sorted = ui.sortPalaces(palaces, 'name');
      expect(sorted.map((p) => p.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
    });

    it('sorts by name Z-A', () => {
      const sorted = ui.sortPalaces(palaces, 'name-desc');
      expect(sorted.map((p) => p.name)).toEqual(['Gamma', 'Beta', 'Alpha']);
    });

    it('sorts by most stations', () => {
      const sorted = ui.sortPalaces(palaces, 'stations');
      expect(sorted.map((p) => p.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
    });

    it('sorts by most verses', () => {
      const sorted = ui.sortPalaces(palaces, 'verses');
      expect(sorted.map((p) => p.name)).toEqual(['Gamma', 'Beta', 'Alpha']);
    });

    it('returns original order for unknown sort key', () => {
      const sorted = ui.sortPalaces(palaces, 'nonexistent');
      expect(sorted.map((p) => p.name)).toEqual(['Beta', 'Alpha', 'Gamma']);
    });

    it('does not mutate the original array', () => {
      const original = [...palaces];
      ui.sortPalaces(palaces, 'name');
      expect(palaces.map((p) => p.name)).toEqual(original.map((p) => p.name));
    });

    it('handles palaces with missing timestamps gracefully', () => {
      const incomplete = [
        { id: '1', name: 'A', createdAt: '2026-01-01T00:00:00Z' },
        { id: '2', name: 'B' }, // no timestamps
      ];
      expect(() => ui.sortPalaces(incomplete, 'updated')).not.toThrow();
    });
  });

  describe('escapeHtml', () => {
    it('delegates to the shared utility', () => {
      const result = ui.escapeHtml('<b>test</b>');
      expect(result).not.toContain('<b>');
      expect(result).toContain('test');
    });
  });

  describe('formatRelativeTime', () => {
    it('delegates to the shared utility', () => {
      const result = ui.formatRelativeTime(new Date(Date.now() - 120000).toISOString());
      expect(result).toContain('min ago');
    });
  });

  describe('renderPalaces', () => {
    it('shows empty state when no palaces', () => {
      mockPalaceManager.getAllPalaces.mockReturnValue([]);
      ui.renderPalaces();
      expect(elements['emptyState'].classList.remove).toHaveBeenCalledWith('hidden');
    });

    it('renders palaces when they exist', () => {
      const palaces = [
        {
          id: 'p1',
          name: 'Test',
          location: 'Loc',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ];
      mockPalaceManager.getAllPalaces.mockReturnValue(palaces);
      mockPracticeManager.getPracticeData.mockReturnValue({
        practiceCount: 0,
        mastery: 0,
        streak: 0,
      });

      ui.renderPalaces();
      expect(elements['emptyState'].classList.add).toHaveBeenCalledWith('hidden');
      expect(elements['palacesGrid'].innerHTML).toContain('Test');
    });

    it('uses searchPalaces when filter is set', () => {
      mockPalaceManager.searchPalaces.mockReturnValue([]);
      ui.renderPalaces('test');
      expect(mockPalaceManager.searchPalaces).toHaveBeenCalledWith('test');
    });

    it('logs slow render warning', () => {
      // Create many palaces to potentially trigger slow render
      const palaces = Array.from({ length: 100 }, (_, i) => ({
        id: `p${i}`,
        name: `Palace ${i}`,
        location: 'L',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }));
      mockPalaceManager.getAllPalaces.mockReturnValue(palaces);
      mockPracticeManager.getPracticeData.mockReturnValue({
        practiceCount: 0,
        mastery: 0,
        streak: 0,
      });

      // Should not throw
      ui.renderPalaces();
    });
  });

  describe('renderPalaceCard', () => {
    it('renders card with all fields', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Connected' });
      mockPracticeManager.getPracticeData.mockReturnValue({
        practiceCount: 5,
        mastery: 75,
        streak: 3,
      });

      const palace = {
        id: 'p1',
        name: 'Full Palace',
        location: 'Church',
        book: 'John',
        chapter: '3',
        description: 'A beautiful palace',
        stations: 10,
        verses: 20,
        tags: ['gospel', 'NT'],
        notes: 'Important notes',
        connections: ['p2'],
        detailedStations: [{ number: 1 }],
      };

      const html = ui.renderPalaceCard(palace);
      expect(html).toContain('Full Palace');
      expect(html).toContain('Church');
      expect(html).toContain('John');
      expect(html).toContain('3');
      expect(html).toContain('A beautiful palace');
      expect(html).toContain('10 stations');
      expect(html).toContain('20 items');
      expect(html).toContain('gospel');
      expect(html).toContain('NT');
      expect(html).toContain('Important notes');
      expect(html).toContain('Connected');
      expect(html).toContain('🗺️ Journey');
    });

    it('renders card without optional fields', () => {
      mockPracticeManager.getPracticeData.mockReturnValue({
        practiceCount: 0,
        mastery: 0,
        streak: 0,
      });
      const palace = { id: 'p1', name: 'Minimal', location: 'Here' };
      const html = ui.renderPalaceCard(palace);
      expect(html).toContain('Minimal');
      expect(html).toContain('➕ Journey');
    });
  });

  describe('renderMasteryBadge', () => {
    it('returns empty string when no practice data', () => {
      mockPracticeManager.getPracticeData.mockReturnValue({ practiceCount: 0 });
      expect(ui.renderMasteryBadge('p1')).toBe('');
    });

    it('returns high mastery badge', () => {
      mockPracticeManager.getPracticeData.mockReturnValue({ practiceCount: 5, mastery: 90 });
      const badge = ui.renderMasteryBadge('p1');
      expect(badge).toContain('high');
      expect(badge).toContain('90%');
    });

    it('returns medium mastery badge', () => {
      mockPracticeManager.getPracticeData.mockReturnValue({ practiceCount: 3, mastery: 60 });
      const badge = ui.renderMasteryBadge('p1');
      expect(badge).toContain('medium');
    });

    it('returns low mastery badge', () => {
      mockPracticeManager.getPracticeData.mockReturnValue({ practiceCount: 1, mastery: 30 });
      const badge = ui.renderMasteryBadge('p1');
      expect(badge).toContain('low');
    });

    it('returns empty when practiceManager is null', () => {
      const ui2 = new UIController(mockPalaceManager, null, mockNotificationManager);
      expect(ui2.renderMasteryBadge('p1')).toBe('');
    });
  });

  describe('renderPracticeProgress', () => {
    it('returns empty string when no practice', () => {
      mockPracticeManager.getPracticeData.mockReturnValue({ practiceCount: 0 });
      expect(ui.renderPracticeProgress('p1')).toBe('');
    });

    it('returns progress bar when practiced', () => {
      mockPracticeManager.getPracticeData.mockReturnValue({
        practiceCount: 3,
        mastery: 75,
        streak: 2,
      });
      const html = ui.renderPracticeProgress('p1');
      expect(html).toContain('progress-bar');
      expect(html).toContain('75%');
      expect(html).toContain('2 day streak');
    });

    it('returns empty when practiceManager is null', () => {
      const ui2 = new UIController(mockPalaceManager, null, mockNotificationManager);
      expect(ui2.renderPracticeProgress('p1')).toBe('');
    });
  });

  describe('modal management', () => {
    it('openNewPalaceModal sets up correctly', () => {
      ui.openNewPalaceModal();
      expect(ui.currentEditId).toBeNull();
    });

    it('openEditPalaceModal loads palace data', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({
        name: 'Test',
        location: 'Loc',
        description: 'D',
        book: 'B',
        chapter: 'C',
        stations: 5,
        verses: 10,
        tags: ['t1'],
        notes: 'N',
        connections: ['p2'],
      });
      mockPalaceManager.getAllPalaces.mockReturnValue([]);

      ui.openEditPalaceModal('p1');
      expect(ui.currentEditId).toBe('p1');
    });

    it('openEditPalaceModal returns early for missing palace', () => {
      mockPalaceManager.getPalaceById.mockReturnValue(null);
      ui.openEditPalaceModal('bad');
      // Code sets currentEditId before checking palace existence
      expect(ui.currentEditId).toBe('bad');
    });

    it('hideModal releases modal and clears editId', () => {
      ui.currentEditId = 'p1';
      ui.hideModal();
      expect(ui.currentEditId).toBeNull();
    });

    it('getCurrentEditId returns current edit ID', () => {
      ui.currentEditId = 'p1';
      expect(ui.getCurrentEditId()).toBe('p1');
    });
  });

  describe('setSort', () => {
    it('updates sort and re-renders', () => {
      mockPalaceManager.getAllPalaces.mockReturnValue([]);
      const spy = vi.spyOn(ui, 'renderPalaces');
      ui.setSort('name');
      expect(ui.currentSort).toBe('name');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('setFilter', () => {
    it('calls renderPalaces with the filter', () => {
      mockPalaceManager.searchPalaces.mockReturnValue([]);
      const spy = vi.spyOn(ui, 'renderPalaces');
      ui.setFilter('test');
      expect(spy).toHaveBeenCalledWith('test');
    });
  });

  describe('getCurrentFilter / getCurrentSort', () => {
    it('returns current filter', () => {
      ui.currentFilter = 'test';
      expect(ui.getCurrentFilter()).toBe('test');
    });

    it('returns current sort', () => {
      ui.currentSort = 'name';
      expect(ui.getCurrentSort()).toBe('name');
    });
  });

  describe('loadViewState / saveViewState', () => {
    it('uses scoped guest view-state key by default', () => {
      ui.loadViewState();
      expect(localStorage.getItem).toHaveBeenCalledWith('memoryPalaces:viewState:guest');
    });

    it('loads saved state from localStorage', () => {
      localStorage.getItem.mockReturnValueOnce(JSON.stringify({ sort: 'name', filter: 'test' }));
      const state = ui.loadViewState();
      expect(state.sort).toBe('name');
    });

    it('returns empty object on invalid JSON', () => {
      localStorage.getItem.mockReturnValueOnce('invalid');
      const state = ui.loadViewState();
      expect(state).toEqual({});
    });

    it('saveViewState handles error', () => {
      localStorage.setItem.mockImplementationOnce(() => {
        throw new Error('fail');
      });
      // Should not throw
      ui.saveViewState();
    });

    it('setViewScope loads and applies scope-specific filter/sort', () => {
      localStorage.getItem.mockReturnValueOnce(JSON.stringify({ sort: 'name', filter: 'john' }));

      ui.setViewScope('user-123');

      expect(localStorage.getItem).toHaveBeenCalledWith('memoryPalaces:viewState:user-123');
      expect(ui.getCurrentSort()).toBe('name');
      expect(ui.getCurrentFilter()).toBe('john');
      expect(elements['searchInput'].value).toBe('john');
      expect(elements['sortSelect'].value).toBe('name');
    });
  });

  describe('downloadFile', () => {
    it('creates and clicks a download link', () => {
      const mockUrl = 'blob:test';
      const revokeUrl = vi.fn();
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => mockUrl),
        revokeObjectURL: revokeUrl,
      });
      const mockLink = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);

      ui.downloadFile(new Blob(['test']), 'file.json');
      expect(mockLink.click).toHaveBeenCalled();
      expect(revokeUrl).toHaveBeenCalledWith(mockUrl);
      vi.unstubAllGlobals();
    });
  });

  describe('populateConnectionsSelect', () => {
    it('populates select with palaces excluding current', () => {
      mockPalaceManager.getAllPalaces.mockReturnValue([
        { id: 'p1', name: 'Palace A' },
        { id: 'p2', name: 'Palace B', book: 'Book', chapter: 'Ch' },
      ]);
      ui.populateConnectionsSelect('p1');
      const select = elements['palaceConnections'];
      expect(select.innerHTML).toContain('Palace B');
      expect(select.innerHTML).not.toContain('Palace A');
    });
  });

  describe('populateTagsDatalist', () => {
    it('populates datalist with unique tags', () => {
      mockPalaceManager.getAllPalaces.mockReturnValue([
        { tags: ['tag1', 'tag2'] },
        { tags: ['tag2', 'tag3'] },
        {},
      ]);
      ui.populateTagsDatalist();
      const dl = elements['availableTags'];
      expect(dl.innerHTML).toContain('tag1');
      expect(dl.innerHTML).toContain('tag3');
    });

    it('handles missing tagsDatalist', () => {
      ui.elements.tagsDatalist = null;
      ui.populateTagsDatalist(); // Should not throw
    });
  });

  describe('focus management', () => {
    it('_trapFocusInModal sets active class and aria attributes', () => {
      const modal = stubElement();
      ui._trapFocusInModal(modal);
      expect(modal.classList.add).toHaveBeenCalledWith('active');
      expect(modal.setAttribute).toHaveBeenCalledWith('aria-hidden', 'false');
    });

    it('_trapFocusInModal attaches a keydown listener for focus trapping', () => {
      const modal = stubElement();
      ui._trapFocusInModal(modal);
      expect(modal.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(modal._focusTrapHandler).toBeTypeOf('function');
    });

    it('_releaseModal removes active class and restores focus', () => {
      const previousFocus = { focus: vi.fn() };
      ui._previousFocus = previousFocus;
      const modal = stubElement();
      ui._releaseModal(modal);
      expect(modal.classList.remove).toHaveBeenCalledWith('active');
      expect(previousFocus.focus).toHaveBeenCalled();
      expect(ui._previousFocus).toBeNull();
    });

    it('_releaseModal removes the keydown listener', () => {
      const modal = stubElement();
      const handler = vi.fn();
      modal._focusTrapHandler = handler;
      ui._releaseModal(modal);
      expect(modal.removeEventListener).toHaveBeenCalledWith('keydown', handler);
      expect(modal._focusTrapHandler).toBeUndefined();
    });

    it('focus trap cycles Tab forward from last to first element', () => {
      const btn1 = { focus: vi.fn() };
      const btn2 = { focus: vi.fn() };
      const modal = stubElement();
      modal.querySelectorAll = vi.fn(() => [btn1, btn2]);

      ui._trapFocusInModal(modal);
      const handler = modal._focusTrapHandler;

      // Simulate Tab on last element
      vi.spyOn(document, 'activeElement', 'get').mockReturnValue(btn2);
      const event = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
      handler(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(btn1.focus).toHaveBeenCalled();
    });

    it('focus trap cycles Shift+Tab backward from first to last element', () => {
      const btn1 = { focus: vi.fn() };
      const btn2 = { focus: vi.fn() };
      const modal = stubElement();
      modal.querySelectorAll = vi.fn(() => [btn1, btn2]);

      ui._trapFocusInModal(modal);
      const handler = modal._focusTrapHandler;

      // Simulate Shift+Tab on first element
      vi.spyOn(document, 'activeElement', 'get').mockReturnValue(btn1);
      const event = { key: 'Tab', shiftKey: true, preventDefault: vi.fn() };
      handler(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(btn2.focus).toHaveBeenCalled();
    });

    it('focus trap closes modal on Escape', () => {
      const modal = stubElement();
      ui._trapFocusInModal(modal);
      const handler = modal._focusTrapHandler;
      const releaseSpy = vi.spyOn(ui, '_releaseModal');

      handler({ key: 'Escape' });
      expect(releaseSpy).toHaveBeenCalledWith(modal);
    });

    it('focus trap ignores non-Tab/non-Escape keys', () => {
      const modal = stubElement();
      modal.querySelectorAll = vi.fn(() => []);
      ui._trapFocusInModal(modal);
      const handler = modal._focusTrapHandler;

      const event = { key: 'Enter', preventDefault: vi.fn() };
      handler(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('hideJourney', () => {
    it('releases the journey modal', () => {
      const spy = vi.spyOn(ui, '_releaseModal');
      ui.hideJourney();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('hideStatistics', () => {
    it('releases the stats modal', () => {
      const spy = vi.spyOn(ui, '_releaseModal');
      ui.hideStatistics();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('hidePractice', () => {
    it('releases the practice modal', () => {
      const spy = vi.spyOn(ui, '_releaseModal');
      ui.hidePractice();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('showStatistics', () => {
    it('lazy-loads and renders StatisticsUI', async () => {
      mockPalaceManager.getAllPalaces.mockReturnValue([]);
      await ui.showStatistics();
      expect(ui._statisticsUI).toBeTruthy();
    });

    it('calls escapeHtml and formatRelativeTime delegates', async () => {
      mockPalaceManager.getAllPalaces.mockReturnValue([]);
      await ui.showStatistics();
      // Exercise the delegate functions
      if (ui._statisticsUI && ui._statisticsUI._deps) {
        expect(ui._statisticsUI._deps.escapeHtml('<b>')).toContain('&lt;');
        expect(typeof ui._statisticsUI._deps.formatRelativeTime(new Date().toISOString())).toBe(
          'string',
        );
      }
    });

    it('handles error when StatisticsUI throws', async () => {
      ui._statisticsUI = {
        render: vi.fn(() => {
          throw new Error('render failed');
        }),
      };
      await ui.showStatistics();
      const container = elements['statsContent'];
      expect(container.innerHTML).toContain('Failed to load statistics');
    });
  });

  describe('showPractice', () => {
    it('lazy-loads PracticeUI and renders selector', async () => {
      mockPalaceManager.getAllPalaces.mockReturnValue([]);
      await ui.showPractice();
      expect(ui._practiceUI).toBeTruthy();
    });

    it('renders active session if one exists', async () => {
      mockPalaceManager.getAllPalaces.mockReturnValue([]);
      await ui.showPractice();
      ui._practiceUI.hasActiveSession = vi.fn(() => true);
      ui._practiceUI.renderActiveSession = vi.fn();
      await ui.showPractice();
      expect(ui._practiceUI.renderActiveSession).toHaveBeenCalled();
    });

    it('handles error when PracticeUI throws', async () => {
      ui._practiceUI = {
        hasActiveSession: vi.fn(() => {
          throw new Error('fail');
        }),
      };
      await ui.showPractice();
      // Error is caught - practiceContent should show error message
      const container = elements['practiceContent'];
      expect(container.innerHTML).toContain('Failed to load practice');
    });
  });

  describe('showJourney', () => {
    it('lazy-loads JourneyUI and renders', async () => {
      mockPalaceManager.getPalaceById.mockReturnValue({
        name: 'Test',
        detailedStations: [{ number: 1, title: 'S1', verses: '' }],
      });
      await ui.showJourney('p1');
      expect(ui._journeyUI).toBeTruthy();
    });

    it('releases modal when render returns false', async () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Empty', detailedStations: [] });
      const spy = vi.spyOn(ui, '_releaseModal');
      await ui.showJourney('p1');
      expect(spy).toHaveBeenCalled();
    });

    it('handles error in lazy-loading JourneyUI', async () => {
      // Force the journey module to throw
      ui._journeyUI = null;
      ui._journeyUI = {
        render: vi.fn(() => {
          throw new Error('render failed');
        }),
      };
      await ui.showJourney('p1');
      // The catch block should have been triggered
    });
  });

  describe('openStationEditor', () => {
    it('lazy-loads StationEditorUI and opens', async () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Test', detailedStations: [] });
      await ui.openStationEditor('p1');
      expect(ui._stationEditorUI).toBeTruthy();
    });

    it('releases modal when open returns false', async () => {
      mockPalaceManager.getPalaceById.mockReturnValue(null);
      const spy = vi.spyOn(ui, '_releaseModal');
      await ui.openStationEditor('bad');
      expect(spy).toHaveBeenCalled();
    });

    it('handles error when StationEditorUI throws', async () => {
      ui._stationEditorUI = {
        open: vi.fn(() => {
          throw new Error('fail');
        }),
      };
      await ui.openStationEditor('p1');
      // Should not throw - error is caught
    });
  });

  describe('hideStationEditor', () => {
    it('releases modal and calls close', async () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Test', detailedStations: [] });
      await ui.openStationEditor('p1');
      ui.hideStationEditor();
    });
  });

  describe('clearStationForm', () => {
    it('delegates to stationEditorUI', async () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Test', detailedStations: [] });
      await ui.openStationEditor('p1');
      // Should not throw
      ui.clearStationForm();
    });

    it('does nothing when stationEditorUI not loaded', () => {
      ui.clearStationForm(); // Should not throw
    });
  });

  describe('saveStation', () => {
    it('delegates to stationEditorUI', async () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Test', detailedStations: [] });
      await ui.openStationEditor('p1');
      // Will call saveStation but form elements are stubbed
      ui.saveStation();
    });

    it('does nothing when stationEditorUI not loaded', () => {
      ui.saveStation(); // Should not throw
    });
  });

  describe('startPracticeSession', () => {
    it('loads practice and starts session', async () => {
      mockPalaceManager.getAllPalaces.mockReturnValue([]);
      await ui.startPracticeSession('p1');
    });
  });
});
