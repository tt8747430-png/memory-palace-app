import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub DOM elements
const stubElement = (overrides = {}) => ({
  classList: { add: vi.fn(), remove: vi.fn(), contains: vi.fn(() => false) },
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  addEventListener: vi.fn(),
  innerHTML: '',
  textContent: '',
  focus: vi.fn(),
  ...overrides,
});

const elements = {};
vi.spyOn(document, 'getElementById').mockImplementation((id) => {
  if (!elements[id]) elements[id] = stubElement();
  return elements[id];
});

import { JourneyUI } from '../src/js/modules/JourneyUI.js';

describe('JourneyUI', () => {
  let journeyUI;
  const mockPalaceManager = {
    getPalaceById: vi.fn(),
  };
  const mockNotificationManager = {
    warning: vi.fn(),
  };
  const mockEscapeHtml = vi.fn((text) => String(text || ''));

  beforeEach(() => {
    vi.clearAllMocks();
    journeyUI = new JourneyUI({
      palaceManager: mockPalaceManager,
      notificationManager: mockNotificationManager,
      escapeHtml: mockEscapeHtml,
    });
  });

  describe('render', () => {
    it('returns false when palace not found', () => {
      mockPalaceManager.getPalaceById.mockReturnValue(null);
      const container = stubElement();
      expect(journeyUI.render('bad-id', container)).toBe(false);
    });

    it('returns false and warns when palace has no stations', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Test', detailedStations: [] });
      const container = stubElement();
      expect(journeyUI.render('p1', container)).toBe(false);
      expect(mockNotificationManager.warning).toHaveBeenCalled();
    });

    it('returns false when detailedStations is missing', () => {
      mockPalaceManager.getPalaceById.mockReturnValue({ name: 'Test' });
      const container = stubElement();
      expect(journeyUI.render('p1', container)).toBe(false);
    });

    it('renders station content and returns true', () => {
      const palace = {
        name: 'Test Palace',
        detailedStations: [
          { number: 1, title: 'Station One', verses: 'John 3:16', keywords: ['love', 'life'] },
          { number: 2, title: 'Station Two', verses: 'Rom 8:28', summary: 'A memory image' },
        ],
      };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);

      let setHtml = '';
      const container = {
        ...stubElement(),
        set innerHTML(val) {
          setHtml = val;
        },
        get innerHTML() {
          return setHtml;
        },
        addEventListener: vi.fn(),
      };

      const result = journeyUI.render('p1', container);
      expect(result).toBe(true);
      expect(setHtml).toContain('Station One');
      expect(setHtml).toContain('journey-station');
    });

    it('renders zone headers for first station in zone', () => {
      const palace = {
        name: 'Zone Palace',
        detailedStations: [
          { number: 1, title: 'S1', zone: 'Zone A', verses: '' },
          { number: 2, title: 'S2', zone: 'Zone A', verses: '' },
          { number: 3, title: 'S3', zone: 'Zone B', verses: '' },
        ],
      };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);

      let setHtml = '';
      const container = {
        ...stubElement(),
        set innerHTML(val) {
          setHtml = val;
        },
        get innerHTML() {
          return setHtml;
        },
        addEventListener: vi.fn(),
      };

      journeyUI.render('p1', container);
      expect(setHtml).toContain('journey-zone-header');
      expect(mockEscapeHtml).toHaveBeenCalledWith('Zone A');
    });

    it('renders rich HTML station images when sourceFormat is html', () => {
      const palace = {
        name: 'Rich Palace',
        sourceFormat: 'html',
        detailedStations: [
          {
            number: 1,
            title: 'S1',
            imageHtml: '<strong>image</strong>',
            imageLabel: 'Custom Label',
            verses: '',
          },
        ],
      };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);

      let setHtml = '';
      const container = {
        ...stubElement(),
        set innerHTML(val) {
          setHtml = val;
        },
        get innerHTML() {
          return setHtml;
        },
        addEventListener: vi.fn(),
      };

      journeyUI.render('p1', container);
      expect(setHtml).toContain('journey-image-box');
      expect(setHtml).toContain('<strong>image</strong>');
    });

    it('renders plain image for non-html format', () => {
      const palace = {
        name: 'Plain Palace',
        detailedStations: [{ number: 1, title: 'S1', summary: 'A scene', verses: '' }],
      };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);

      let setHtml = '';
      const container = {
        ...stubElement(),
        set innerHTML(val) {
          setHtml = val;
        },
        get innerHTML() {
          return setHtml;
        },
        addEventListener: vi.fn(),
      };

      journeyUI.render('p1', container);
      expect(setHtml).toContain('journey-station-image');
    });

    it('renders senses section when senses are present', () => {
      const palace = {
        name: 'Senses Palace',
        detailedStations: [{ number: 1, title: 'S1', senses: ['sight', 'sound'], verses: '' }],
      };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);

      let setHtml = '';
      const container = {
        ...stubElement(),
        set innerHTML(val) {
          setHtml = val;
        },
        get innerHTML() {
          return setHtml;
        },
        addEventListener: vi.fn(),
      };

      journeyUI.render('p1', container);
      expect(setHtml).toContain('journey-senses');
      expect(setHtml).toContain('journey-sense-tag');
    });

    it('renders verse blocks when present', () => {
      const palace = {
        name: 'Verse Palace',
        detailedStations: [
          {
            number: 1,
            title: 'S1',
            verses: '',
            verseBlocks: [{ ref: 'John 3:16', text: 'For God so loved', html: '<em>For God</em>' }],
          },
        ],
      };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);

      let setHtml = '';
      const container = {
        ...stubElement(),
        set innerHTML(val) {
          setHtml = val;
        },
        get innerHTML() {
          return setHtml;
        },
        addEventListener: vi.fn(),
      };

      journeyUI.render('p1', container);
      expect(setHtml).toContain('journey-verse-box');
      expect(setHtml).toContain('<em>For God</em>');
    });

    it('renders keywords for non-html format', () => {
      const palace = {
        name: 'Keyword Palace',
        detailedStations: [{ number: 1, title: 'S1', keywords: ['key1', 'key2'], verses: '' }],
      };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);

      let setHtml = '';
      const container = {
        ...stubElement(),
        set innerHTML(val) {
          setHtml = val;
        },
        get innerHTML() {
          return setHtml;
        },
        addEventListener: vi.fn(),
      };

      journeyUI.render('p1', container);
      expect(setHtml).toContain('journey-keywords');
      expect(setHtml).toContain('journey-keyword');
    });

    it('does not render keywords for html format', () => {
      const palace = {
        name: 'HTML Palace',
        sourceFormat: 'html',
        detailedStations: [{ number: 1, title: 'S1', keywords: ['k1'], verses: '' }],
      };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);

      let setHtml = '';
      const container = {
        ...stubElement(),
        set innerHTML(val) {
          setHtml = val;
        },
        get innerHTML() {
          return setHtml;
        },
        addEventListener: vi.fn(),
      };

      journeyUI.render('p1', container);
      expect(setHtml).not.toContain('journey-keywords');
    });

    it('handles click delegation for next/previous/jump', () => {
      const palace = {
        name: 'Nav Palace',
        detailedStations: [
          { number: 1, title: 'S1', verses: '' },
          { number: 2, title: 'S2', verses: '' },
          { number: 3, title: 'S3', verses: '' },
        ],
      };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);

      const clickHandlers = [];
      const keydownHandlers = [];
      let setHtml = '';
      const container = {
        ...stubElement(),
        set innerHTML(val) {
          setHtml = val;
        },
        get innerHTML() {
          return setHtml;
        },
        addEventListener: vi.fn((event, handler) => {
          if (event === 'click') clickHandlers.push(handler);
          if (event === 'keydown') keydownHandlers.push(handler);
        }),
      };

      journeyUI.render('p1', container);

      // Simulate nextStation click
      const nextEl = {
        dataset: { action: 'nextStation' },
        closest: vi.fn((sel) => (sel === '[data-action]' ? nextEl : null)),
      };
      clickHandlers[0]({ target: nextEl });
      expect(setHtml).toContain('S2');

      // Simulate previousStation click
      const prevEl = {
        dataset: { action: 'previousStation' },
        closest: vi.fn((sel) => (sel === '[data-action]' ? prevEl : null)),
      };
      clickHandlers[0]({ target: prevEl });
      expect(setHtml).toContain('S1');

      // Simulate jumpToStation click
      const jumpEl = {
        dataset: { action: 'jumpToStation', index: '2' },
        closest: vi.fn((sel) => (sel === '[data-action]' ? jumpEl : null)),
      };
      clickHandlers[0]({ target: jumpEl });
      expect(setHtml).toContain('S3');

      // Click with no action element
      const noAction = { closest: vi.fn(() => null) };
      clickHandlers[0]({ target: noAction });
    });

    it('handles keyboard delegation for jumpToStation', () => {
      const palace = {
        name: 'KB Palace',
        detailedStations: [
          { number: 1, title: 'S1', verses: '' },
          { number: 2, title: 'S2', verses: '' },
        ],
      };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);

      const keydownHandlers = [];
      let setHtml = '';
      const container = {
        ...stubElement(),
        set innerHTML(val) {
          setHtml = val;
        },
        get innerHTML() {
          return setHtml;
        },
        addEventListener: vi.fn((event, handler) => {
          if (event === 'keydown') keydownHandlers.push(handler);
        }),
      };

      journeyUI.render('p1', container);

      // Simulate Enter on jump dot
      const dotTarget = { dataset: { action: 'jumpToStation', index: '1' } };
      keydownHandlers[0]({ key: 'Enter', target: dotTarget, preventDefault: vi.fn() });
      expect(setHtml).toContain('S2');

      // Simulate Space on jump dot
      keydownHandlers[0]({ key: ' ', target: dotTarget, preventDefault: vi.fn() });

      // Non-matching key should be ignored
      keydownHandlers[0]({ key: 'a', target: dotTarget, preventDefault: vi.fn() });

      // Non-matching action
      keydownHandlers[0]({
        key: 'Enter',
        target: { dataset: { action: 'other' } },
        preventDefault: vi.fn(),
      });
    });

    it('does not go past boundaries', () => {
      const palace = {
        name: 'Boundary',
        detailedStations: [{ number: 1, title: 'S1', verses: '' }],
      };
      mockPalaceManager.getPalaceById.mockReturnValue(palace);

      const clickHandlers = [];
      let setHtml = '';
      const container = {
        ...stubElement(),
        set innerHTML(val) {
          setHtml = val;
        },
        get innerHTML() {
          return setHtml;
        },
        addEventListener: vi.fn((event, handler) => {
          if (event === 'click') clickHandlers.push(handler);
        }),
      };

      journeyUI.render('p1', container);

      // Try to go next when at last station (only 1 station)
      const nextEl = {
        dataset: { action: 'nextStation' },
        closest: vi.fn((sel) => (sel === '[data-action]' ? nextEl : null)),
      };
      clickHandlers[0]({ target: nextEl });
      // Should still show S1
      expect(setHtml).toContain('S1');

      // Try to go previous when at first station
      const prevEl = {
        dataset: { action: 'previousStation' },
        closest: vi.fn((sel) => (sel === '[data-action]' ? prevEl : null)),
      };
      clickHandlers[0]({ target: prevEl });
      expect(setHtml).toContain('S1');
    });
  });
});
