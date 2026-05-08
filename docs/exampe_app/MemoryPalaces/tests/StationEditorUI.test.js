import { describe, it, expect, vi, beforeEach } from 'vitest';

const stubElement = (overrides = {}) => ({
  classList: { add: vi.fn(), remove: vi.fn() },
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  innerHTML: '',
  textContent: '',
  value: '',
  focus: vi.fn(),
  reset: vi.fn(),
  ...overrides,
});

const elements = {};
vi.spyOn(document, 'getElementById').mockImplementation((id) => {
  if (!elements[id]) elements[id] = stubElement();
  return elements[id];
});

import { StationEditorUI } from '../src/js/modules/StationEditorUI.js';

describe('StationEditorUI', () => {
  let editor;
  const mockPalaceManager = {
    getPalaceById: vi.fn(),
    updatePalace: vi.fn(),
  };
  const mockNotificationManager = {
    success: vi.fn(),
    confirm: vi.fn(),
  };
  const mockEscapeHtml = vi.fn((text) => String(text || ''));

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset element stubs
    Object.keys(elements).forEach((k) => delete elements[k]);
    // Create fresh stationList with addEventListener
    elements['stationList'] = stubElement({ addEventListener: vi.fn() });
    elements['stationForm'] = stubElement();

    editor = new StationEditorUI({
      palaceManager: mockPalaceManager,
      notificationManager: mockNotificationManager,
      escapeHtml: mockEscapeHtml,
    });
  });

  describe('open', () => {
    it('returns false when palace not found', () => {
      mockPalaceManager.getPalaceById.mockReturnValue(null);
      expect(editor.open('bad-id')).toBe(false);
    });

    it('returns true and sets up stations when palace found', () => {
      const palace = {
        name: 'Test Palace',
        detailedStations: [{ number: 1, title: 'S1' }],
      };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);

      const result = editor.open('p1');
      expect(result).toBe(true);
      expect(editor.currentEditId).toBe('p1');
      expect(editor.currentStations).toHaveLength(1);
      expect(elements['stationEditorTitle'].textContent).toBe('Manage Stations: Test Palace');
    });

    it('handles palace with no detailedStations', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({
        name: 'Empty',
        detailedStations: undefined,
      });
      const result = editor.open('p1');
      expect(result).toBe(true);
      expect(editor.currentStations).toEqual([]);
    });

    it('aborts and re-attaches delegation on re-open (AbortController pattern)', () => {
      const palace = { name: 'Test', detailedStations: [] };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);
      editor.open('p1');
      const firstAbort = editor._delegationAbort;
      editor.open('p2');
      // A new AbortController is created, old one is aborted
      expect(editor._delegationAbort).not.toBe(firstAbort);
      expect(firstAbort.signal.aborted).toBe(true);
    });
  });

  describe('close', () => {
    it('clears current stations', () => {
      editor.currentStations = [{ number: 1 }];
      editor.close();
      expect(editor.currentStations).toEqual([]);
    });
  });

  describe('renderStationList', () => {
    it('renders empty message when no stations', () => {
      editor.currentStations = [];
      editor.renderStationList();
      expect(editor.elements.stationList.innerHTML).toContain('No stations yet');
    });

    it('renders station items when stations exist', () => {
      editor.currentStations = [
        { number: 1, title: 'Station One' },
        { number: 2, title: 'Station Two' },
      ];
      editor.renderStationList();
      expect(editor.elements.stationList.innerHTML).toContain('Station One');
      expect(editor.elements.stationList.innerHTML).toContain('Station Two');
      expect(editor.elements.stationList.innerHTML).toContain('data-action="deleteStation"');
    });
  });

  describe('clearStationForm', () => {
    it('resets the form and sets next station number', () => {
      editor.currentStations = [{ number: 1 }, { number: 2 }];
      editor.clearStationForm();
      expect(elements['stationForm'].reset).toHaveBeenCalled();
      expect(elements['stationIndex'].value).toBe('');
      expect(elements['stationFormTitle'].textContent).toBe('Add New Station');
      expect(elements['stationTitle'].value).toBe('3. ');
    });
  });

  describe('loadStationIntoForm', () => {
    it('loads station data into form fields', () => {
      editor.currentStations = [
        { number: 1, title: 'S1', verses: 'V1', summary: 'Sum1', keywords: ['k1', 'k2'] },
      ];
      // Mock querySelectorAll for active class management
      editor.elements.stationList.querySelectorAll = vi.fn(() => {
        const items = [{ classList: { add: vi.fn(), remove: vi.fn() } }];
        return items;
      });

      editor.loadStationIntoForm(0);
      expect(elements['stationIndex'].value).toBe(0);
      expect(elements['stationTitle'].value).toBe('S1');
      expect(elements['stationVerses'].value).toBe('V1');
      expect(elements['stationImage'].value).toBe('Sum1');
      expect(elements['stationKeywords'].value).toBe('k1, k2');
      expect(elements['stationFormTitle'].textContent).toBe('Edit Station #1');
    });

    it('uses image field as fallback when no summary', () => {
      editor.currentStations = [{ number: 1, title: 'S1', image: 'img1' }];
      editor.elements.stationList.querySelectorAll = vi.fn(() => []);
      editor.loadStationIntoForm(0);
      expect(elements['stationImage'].value).toBe('img1');
    });

    it('returns early for invalid index', () => {
      editor.currentStations = [];
      editor.loadStationIntoForm(5);
      // Should not throw
    });

    it('handles station without keywords', () => {
      editor.currentStations = [{ number: 1, title: 'S1' }];
      editor.elements.stationList.querySelectorAll = vi.fn(() => []);
      editor.loadStationIntoForm(0);
      expect(elements['stationKeywords'].value).toBe('');
    });
  });

  describe('saveStation', () => {
    const renderFn = vi.fn();

    it('adds a new station when stationIndex is empty', () => {
      editor.currentEditId = 'p1';
      editor.currentStations = [];
      document.getElementById('stationIndex').value = '';
      document.getElementById('stationTitle').value = 'New Station';
      document.getElementById('stationVerses').value = 'V1';
      document.getElementById('stationImage').value = 'img';
      document.getElementById('stationKeywords').value = 'k1, k2';

      editor.saveStation(renderFn);

      expect(editor.currentStations).toHaveLength(1);
      expect(editor.currentStations[0].number).toBe(1);
      expect(mockPalaceManager.updatePalace).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
          stations: 1,
        }),
      );
      expect(mockNotificationManager.success).toHaveBeenCalledWith('Station added');
      expect(renderFn).toHaveBeenCalled();
    });

    it('updates an existing station when stationIndex is set', () => {
      editor.currentEditId = 'p1';
      editor.currentStations = [{ number: 1, title: 'Old Title' }];
      document.getElementById('stationIndex').value = '0';
      document.getElementById('stationTitle').value = 'Updated Title';
      document.getElementById('stationVerses').value = '';
      document.getElementById('stationImage').value = '';
      document.getElementById('stationKeywords').value = '';

      editor.saveStation(renderFn);

      expect(editor.currentStations[0].title).toBe('Updated Title');
      expect(editor.currentStations[0].number).toBe(1);
      expect(mockNotificationManager.success).toHaveBeenCalledWith('Station updated');
    });
  });

  describe('deleteStation', () => {
    it('uses notificationManager.confirm and executes callback', () => {
      editor.currentEditId = 'p1';
      editor.currentStations = [{ number: 1, title: 'S1' }];

      editor.deleteStation(0);
      expect(mockNotificationManager.confirm).toHaveBeenCalledWith(
        'Delete this station?',
        expect.any(Function),
      );

      // Exercise the confirm callback
      const confirmCb = mockNotificationManager.confirm.mock.calls[0][1];
      confirmCb();
      expect(mockNotificationManager.success).toHaveBeenCalledWith('Station deleted');
    });

    it('uses native confirm when notificationManager is null', () => {
      const editorNoNotif = new StationEditorUI({
        palaceManager: mockPalaceManager,
        notificationManager: null,
        escapeHtml: mockEscapeHtml,
      });
      editorNoNotif.currentEditId = 'p1';
      editorNoNotif.currentStations = [{ number: 1, title: 'S1' }];

      vi.stubGlobal(
        'confirm',
        vi.fn(() => true),
      );
      editorNoNotif.deleteStation(0);
      expect(globalThis.confirm).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });
  });

  describe('_performDelete', () => {
    it('removes station, renumbers, and updates palace', () => {
      editor.currentEditId = 'p1';
      editor.currentStations = [
        { number: 1, title: 'S1' },
        { number: 2, title: 'S2' },
        { number: 3, title: 'S3' },
      ];

      editor._performDelete(1);

      expect(editor.currentStations).toHaveLength(2);
      expect(editor.currentStations[0].number).toBe(1);
      expect(editor.currentStations[1].number).toBe(2);
      expect(mockPalaceManager.updatePalace).toHaveBeenCalled();
      expect(mockNotificationManager.success).toHaveBeenCalledWith('Station deleted');
    });
  });

  describe('_setupDelegation', () => {
    it('handles deleteStation click via delegation', () => {
      const palace = { name: 'Test', detailedStations: [{ number: 1, title: 'S1' }] };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);
      editor.open('p1');

      // Get the click handler registered on stationList
      const clickHandler = elements['stationList'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      )?.[1];
      expect(clickHandler).toBeTruthy();

      // Simulate click on deleteStation button
      const actionEl = { dataset: { action: 'deleteStation', index: '0' } };
      const e = {
        target: { closest: vi.fn((sel) => (sel === '[data-action]' ? actionEl : null)) },
        stopPropagation: vi.fn(),
      };
      clickHandler(e);
      expect(e.stopPropagation).toHaveBeenCalled();
    });

    it('handles station item click for editing', () => {
      const palace = { name: 'Test', detailedStations: [{ number: 1, title: 'S1' }] };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);
      editor.open('p1');

      const clickHandler = elements['stationList'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      )?.[1];

      // Simulate click on station item (not the delete button)
      const itemEl = { dataset: { index: '0' } };
      const e = {
        target: {
          closest: vi.fn((sel) => {
            if (sel === '[data-action]') return null;
            if (sel === '.station-item[data-index]') return itemEl;
            return null;
          }),
        },
        stopPropagation: vi.fn(),
      };
      clickHandler(e);
      // Should have attempted to load station into form
      expect(elements['stationIndex'].value).toBe(0);
    });

    it('does nothing when click target is not actionable', () => {
      const palace = { name: 'Test', detailedStations: [] };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);
      editor.open('p1');

      const clickHandler = elements['stationList'].addEventListener.mock.calls.find(
        (c) => c[0] === 'click',
      )?.[1];

      const e = {
        target: { closest: vi.fn(() => null) },
        stopPropagation: vi.fn(),
      };
      // Should not throw
      clickHandler(e);
    });
  });
});
