import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const store = {};
const mockLocalStorage = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => {
    store[key] = String(value);
  }),
  removeItem: vi.fn((key) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  }),
};
vi.stubGlobal('localStorage', mockLocalStorage);

import { ThemeManager } from '../src/js/modules/ThemeManager.js';

describe('ThemeManager', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('initial state', () => {
    it('defaults to "auto" when nothing is saved', () => {
      const tm = new ThemeManager();
      expect(tm.currentTheme).toBe('auto');
    });

    it('loads saved theme from localStorage', () => {
      store['appTheme'] = 'dark';
      const tm = new ThemeManager();
      expect(tm.currentTheme).toBe('dark');
    });

    it('applies the loaded theme on construction', () => {
      store['appTheme'] = 'dark';
      const tm = new ThemeManager();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(tm.currentTheme).toBe('dark');
    });
  });

  describe('applyTheme', () => {
    it('sets data-theme attribute for explicit themes', () => {
      const tm = new ThemeManager();
      tm.applyTheme('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      tm.applyTheme('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('removes data-theme for "auto" to let CSS media queries take over', () => {
      const tm = new ThemeManager();
      tm.applyTheme('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      tm.applyTheme('auto');
      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });

    it('persists theme to localStorage', () => {
      const tm = new ThemeManager();
      tm.applyTheme('dark');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('appTheme', 'dark');
    });
  });

  describe('toggleTheme', () => {
    it('cycles light → dark → auto → light', () => {
      const tm = new ThemeManager();

      tm.applyTheme('light');
      expect(tm.toggleTheme()).toBe('dark');
      expect(tm.toggleTheme()).toBe('auto');
      expect(tm.toggleTheme()).toBe('light');
    });

    it('defaults to light for unknown themes', () => {
      const tm = new ThemeManager();
      tm.currentTheme = 'unknown';
      expect(tm.toggleTheme()).toBe('light');
    });
  });

  describe('getEffectiveTheme', () => {
    it('returns the theme directly when not auto', () => {
      const tm = new ThemeManager();
      tm.applyTheme('dark');
      expect(tm.getEffectiveTheme()).toBe('dark');

      tm.applyTheme('light');
      expect(tm.getEffectiveTheme()).toBe('light');
    });

    it('resolves "auto" via matchMedia for dark preference', () => {
      // Mock matchMedia to report dark preference
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });

      const tm = new ThemeManager();
      tm.applyTheme('auto');
      expect(tm.getEffectiveTheme()).toBe('dark');

      window.matchMedia = originalMatchMedia;
    });

    it('resolves "auto" via matchMedia for light preference', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue({ matches: false });

      const tm = new ThemeManager();
      tm.applyTheme('auto');
      expect(tm.getEffectiveTheme()).toBe('light');

      window.matchMedia = originalMatchMedia;
    });
  });
});
