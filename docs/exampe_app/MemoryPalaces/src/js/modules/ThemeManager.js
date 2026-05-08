/**
 * ThemeManager - Handles theme switching and customization
 * Supports: 'light', 'dark', 'auto' (follows system preference)
 */
export class ThemeManager {
  constructor() {
    this.storageKey = 'appTheme';
    this.currentTheme = this.loadTheme();
    this.applyTheme(this.currentTheme);
  }

  loadTheme() {
    const saved = localStorage.getItem(this.storageKey);
    // Default to 'auto' for new users (respects OS preference)
    return saved || 'auto';
  }

  saveTheme(theme) {
    localStorage.setItem(this.storageKey, theme);
  }

  applyTheme(theme) {
    if (theme === 'auto') {
      // Remove data-theme so CSS @media (prefers-color-scheme) takes over
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    this.currentTheme = theme;
    this.saveTheme(theme);
  }

  /**
   * Cycle: light → dark → auto → light …
   */
  toggleTheme() {
    const cycle = { light: 'dark', dark: 'auto', auto: 'light' };
    const newTheme = cycle[this.currentTheme] || 'light';
    this.applyTheme(newTheme);
    return newTheme;
  }

  /**
   * Returns the effective visual theme (resolves 'auto' to actual value).
   */
  getEffectiveTheme() {
    if (this.currentTheme !== 'auto') return this.currentTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
