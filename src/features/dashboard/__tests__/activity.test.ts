import { describe, expect, it } from 'vitest';
import { describeEvent, formatRelative, sortByRecency, type ActivityEvent } from '../activity';

describe('formatRelative', () => {
  const now = new Date('2026-05-14T12:00:00Z');

  it('returns "just now" for under a minute', () => {
    expect(formatRelative(new Date(now.getTime() - 30_000), now)).toBe('just now');
  });

  it('returns minutes for under an hour', () => {
    expect(formatRelative(new Date(now.getTime() - 5 * 60_000), now)).toBe('5m ago');
  });

  it('returns hours for under a day', () => {
    expect(formatRelative(new Date(now.getTime() - 3 * 3600_000), now)).toBe('3h ago');
  });

  it('returns days for under a week', () => {
    expect(formatRelative(new Date(now.getTime() - 2 * 86_400_000), now)).toBe('2d ago');
  });

  it('falls back to absolute date past a week', () => {
    const result = formatRelative(new Date(now.getTime() - 14 * 86_400_000), now);
    expect(result).not.toMatch(/ago/);
  });
});

describe('describeEvent', () => {
  it('describes a practice event with room context', () => {
    const event: ActivityEvent = {
      kind: 'practice',
      id: 'p1',
      at: new Date(),
      nodeTitle: 'Pythagoras',
      roomTitle: 'Atrium',
      mode: 'multiple-choice',
      correct: true,
      score: 1,
    };
    expect(describeEvent(event)).toBe('Reviewed "Pythagoras" in Atrium');
  });

  it('marks missed practice', () => {
    const event: ActivityEvent = {
      kind: 'practice',
      id: 'p2',
      at: new Date(),
      nodeTitle: 'Fermat',
      mode: 'typed-recall',
      correct: false,
      score: 0,
    };
    expect(describeEvent(event)).toContain('(missed)');
  });

  it('describes a node addition', () => {
    const event: ActivityEvent = {
      kind: 'node-added',
      id: 'n1',
      at: new Date(),
      nodeTitle: 'Euler',
      roomTitle: 'Library',
    };
    expect(describeEvent(event)).toBe('Added "Euler" to Library');
  });
});

describe('sortByRecency', () => {
  it('sorts newest first', () => {
    const a = { at: new Date('2026-05-14T10:00:00Z') };
    const b = { at: new Date('2026-05-14T12:00:00Z') };
    expect(sortByRecency([a, b])).toEqual([b, a]);
  });
});
