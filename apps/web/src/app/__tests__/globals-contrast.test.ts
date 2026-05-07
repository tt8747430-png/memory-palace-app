import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const cssPath = join(__dirname, '../globals.css');
const css = readFileSync(cssPath, 'utf8');

/**
 * Parse a HSL lightness value from `hsl(H S% L%)` in the :root block.
 * Returns the lightness as a number 0–100.
 */
function getLightness(varName: string, block: string): number | null {
  // Match: --var-name: hsl(H S% L%);
  const re = new RegExp(`${varName}:\\s*hsl\\(\\d+\\s+\\d+%\\s+(\\d+)%\\)`, 'i');
  const m = block.match(re);
  return m ? parseInt(m[1], 10) : null;
}

// Extract the :root block (light mode).
const rootMatch = css.match(/:root\s*\{([^}]+)\}/s);
const rootBlock = rootMatch ? rootMatch[1] : '';

describe('globals.css — WCAG AA contrast sanity', () => {
  it('--muted-foreground (light mode) lightness is ≤ 40% for sufficient contrast on white', () => {
    const lightness = getLightness('--muted-foreground', rootBlock);
    expect(lightness).not.toBeNull();
    // At lightness ≤ 40% on white background the contrast ratio exceeds 4.5:1.
    expect(lightness!).toBeLessThanOrEqual(40);
  });

  it('--destructive-text exists and lightness is ≤ 40%', () => {
    const lightness = getLightness('--destructive-text', rootBlock);
    expect(lightness).not.toBeNull();
    expect(lightness!).toBeLessThanOrEqual(40);
  });
});
