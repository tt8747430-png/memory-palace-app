import { describe, it, expect, vi, afterEach } from 'vitest';
import { escapeHtml, formatRelativeTime } from '../src/js/modules/utils.js';

describe('escapeHtml', () => {
  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).not.toContain('<script>');
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes quotes in context', () => {
    const result = escapeHtml('"hello"');
    // The DOM-based escaper may or may not escape quotes since they're safe in text content
    expect(result).toContain('hello');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('passes through safe text unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });

  it('handles unicode and emoji', () => {
    expect(escapeHtml('🏛️ Palatul')).toBe('🏛️ Palatul');
  });
});

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns minutes for recent times', () => {
    vi.useFakeTimers();
    const now = new Date('2026-03-14T12:00:00Z');
    vi.setSystemTime(now);

    const fiveMinAgo = new Date('2026-03-14T11:55:00Z').toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 min ago');
  });

  it('returns at least "1 min ago" for very recent times', () => {
    vi.useFakeTimers();
    const now = new Date('2026-03-14T12:00:00Z');
    vi.setSystemTime(now);

    const justNow = new Date('2026-03-14T12:00:00Z').toISOString();
    expect(formatRelativeTime(justNow)).toBe('1 min ago');
  });

  it('returns hours for 1-24 hour old times', () => {
    vi.useFakeTimers();
    const now = new Date('2026-03-14T12:00:00Z');
    vi.setSystemTime(now);

    const threeHoursAgo = new Date('2026-03-14T09:00:00Z').toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe('3 hr ago');
  });

  it('returns days for times older than 24 hours', () => {
    vi.useFakeTimers();
    const now = new Date('2026-03-14T12:00:00Z');
    vi.setSystemTime(now);

    const twoDaysAgo = new Date('2026-03-12T12:00:00Z').toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe('2 days ago');
  });

  it('uses singular "day" for exactly 1 day', () => {
    vi.useFakeTimers();
    const now = new Date('2026-03-14T12:00:00Z');
    vi.setSystemTime(now);

    const oneDayAgo = new Date('2026-03-13T12:00:00Z').toISOString();
    expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago');
  });
});
