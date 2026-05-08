// noinspection HtmlRequiredAltAttribute,HtmlRequiredLangAttribute,HtmlUnknownAttribute,HtmlRequiredTitleElement,HttpUrlsUsage

import { describe, it, expect, beforeEach } from 'vitest';
import { sanitizeHtml, validatePalace } from '../src/js/modules/validation.js';

/**
 * Build malicious HTML strings at runtime so WebStorm's HTML inspector
 * doesn't flag intentionally broken markup inside test string literals.
 */
const xss = {
  get script() {
    return '<scr' + 'ipt>alert("xss")</scr' + 'ipt>safe text';
  },
  get imgOnerror() {
    return ['<im', 'g src="x" on', 'error="alert(1)">text'].join('');
  },
  get iframe() {
    return '<ifra' + 'me src="evil.com"></ifra' + 'me>content';
  },
  get imgInVerse() {
    return ['<span class="kw">key</span><im', 'g on', 'error="x">'].join('');
  },
};

describe('sanitizeHtml', () => {
  it('keeps safe tags like <strong>, <em>, <span>', () => {
    const input = '<strong>bold</strong> and <em>italic</em>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });

  it('preserves class attributes on allowed tags', () => {
    const input = '<span class="kw">keyword</span>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<span class="kw">keyword</span>');
  });

  it('strips dangerous tags like <script>', () => {
    const result = sanitizeHtml(xss.script);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('safe text');
  });

  it('strips img tags with onerror handlers', () => {
    const result = sanitizeHtml(xss.imgOnerror);
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
    expect(result).toContain('text');
  });

  it('strips onclick and other event attributes', () => {
    const input = '<span onclick="alert(1)" class="kw">test</span>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
    expect(result).toContain('class="kw"');
    expect(result).toContain('test');
  });

  it('strips iframe tags', () => {
    const result = sanitizeHtml(xss.iframe);
    expect(result).not.toContain('<iframe');
    expect(result).toContain('content');
  });

  it('handles empty/null input gracefully', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });

  it('strips javascript: URIs from href attributes', () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('strips data: URIs from src/href attributes', () => {
    const input = '<img src="data:text/html,<script>alert(1)</script>">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('data:');
    expect(result).not.toContain('<img');
  });

  it('strips event handler attributes (onload, onfocus, etc.)', () => {
    const input = '<span onload="evil()" onfocus="evil()">text</span>';
    const result = sanitizeHtml(input);
    expect(result).not.toMatch(/on\w+=/);
    expect(result).toContain('text');
  });

  it('escapes raw text that looks like HTML', () => {
    const input = 'a < b && c > d';
    const result = sanitizeHtml(input);
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&amp;');
  });

  it('handles nested safe tags', () => {
    const input = '<p><strong>bold <em>and italic</em></strong></p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<strong>bold <em>and italic</em></strong>');
  });
});

describe('validatePalace', () => {
  let validPalace;

  beforeEach(() => {
    validPalace = {
      name: 'Test Palace',
      location: 'Test Location',
      description: 'A test palace',
      book: 'Test',
      chapter: '1',
      stations: 5,
      verses: 10,
      tags: ['test'],
      connections: [],
      detailedStations: [],
    };
  });

  it('accepts a valid palace', () => {
    const result = validatePalace(validPalace);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing name', () => {
    delete validPalace.name;
    const result = validatePalace(validPalace);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('name'))).toBe(true);
  });

  it('rejects missing location', () => {
    delete validPalace.location;
    const result = validatePalace(validPalace);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('location'))).toBe(true);
  });

  it('rejects non-number verses', () => {
    validPalace.verses = 'ten';
    const result = validatePalace(validPalace);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('verses'))).toBe(true);
  });

  it('rejects non-array connections', () => {
    validPalace.connections = 'not-an-array';
    const result = validatePalace(validPalace);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('connections'))).toBe(true);
  });

  it('rejects non-array detailedStations', () => {
    validPalace.detailedStations = 'not-an-array';
    const result = validatePalace(validPalace);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('detailedStations'))).toBe(true);
  });

  it('rejects non-number stations', () => {
    validPalace.stations = 'five';
    const result = validatePalace(validPalace);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('stations'))).toBe(true);
  });

  it('rejects non-array tags', () => {
    validPalace.tags = 'not-an-array';
    const result = validatePalace(validPalace);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('tags'))).toBe(true);
  });

  it('rejects null input', () => {
    const result = validatePalace(null);
    expect(result.valid).toBe(false);
  });

  it('rejects array input', () => {
    const result = validatePalace([]);
    expect(result.valid).toBe(false);
  });

  it('sanitizes imageHtml in detailedStations', () => {
    validPalace.detailedStations = [
      {
        number: 1,
        title: 'Station 1',
        imageHtml: '<strong>safe</strong>' + xss.script,
        verseBlocks: [{ ref: '1:1', text: 'verse', html: xss.imgInVerse }],
      },
    ];
    const result = validatePalace(validPalace);
    expect(result.valid).toBe(true);
    // imageHtml should be sanitized
    expect(result.sanitized.detailedStations[0].imageHtml).toContain('<strong>safe</strong>');
    expect(result.sanitized.detailedStations[0].imageHtml).not.toContain('<script>');
    // verseBlock html should be sanitized
    expect(result.sanitized.detailedStations[0].verseBlocks[0].html).toContain(
      '<span class="kw">key</span>',
    );
    expect(result.sanitized.detailedStations[0].verseBlocks[0].html).not.toContain('<img');
  });
});
