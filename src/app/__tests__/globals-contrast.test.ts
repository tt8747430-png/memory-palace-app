import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const cssPath = join(__dirname, '../globals.css');
const css = readFileSync(cssPath, 'utf8');

function getLightness(varName: string, block: string): number | null {
  const re = new RegExp(`${varName}:\\s*hsl\\(\\d+\\s+\\d+%\\s+(\\d+)%\\)`, 'i');
  const m = block.match(re);
  return m ? parseInt(m[1], 10) : null;
}

const rootMatch = css.match(/:root\s*\{([^}]+)\}/s);
const rootBlock = rootMatch ? rootMatch[1] : '';

describe('globals.css — WCAG AA contrast sanity', () => {
  it('--muted-foreground (light mode) lightness is ≤ 40% for sufficient contrast on white', () => {
    const lightness = getLightness('--muted-foreground', rootBlock);
    expect(lightness).not.toBeNull();

    expect(lightness!).toBeLessThanOrEqual(40);
  });

  it('--destructive-text exists and lightness is ≤ 40%', () => {
    const lightness = getLightness('--destructive-text', rootBlock);
    expect(lightness).not.toBeNull();
    expect(lightness!).toBeLessThanOrEqual(40);
  });
});
