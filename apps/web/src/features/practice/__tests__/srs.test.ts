import { describe, it, expect } from 'vitest';
import {
  SRS_BOUNDS,
  applyReview,
  initialReviewState,
  isDue,
  nextEaseFactor,
  nextIntervalDays,
  nextMastery,
  qualityFromScore,
} from '../lib/srs';

const NOW = new Date('2026-05-08T12:00:00.000Z');

describe('qualityFromScore', () => {
  it.each([
    [100, true, 5],
    [95, true, 5],
    [90, true, 5],
    [80, true, 4],
    [70, true, 4],
    [60, true, 3],
    [0, true, 3],
    [60, false, 2],
    [50, false, 2],
    [49, false, 1],
    [25, false, 1],
    [24, false, 0],
    [0, false, 0],
  ])('score=%i correct=%s -> q=%i', (score, correct, expected) => {
    expect(qualityFromScore(score, correct)).toBe(expected);
  });
});

describe('nextEaseFactor', () => {
  it('floors at 1.3 for low quality', () => {
    expect(nextEaseFactor(1.3, 0)).toBe(SRS_BOUNDS.minEaseFactor);
    expect(nextEaseFactor(1.4, 0)).toBeCloseTo(1.3, 5);
  });

  it('increases on q=5', () => {
    const next = nextEaseFactor(2.5, 5);
    expect(next).toBeCloseTo(2.6, 5);
  });

  it('keeps EF unchanged on q=4', () => {
    expect(nextEaseFactor(2.5, 4)).toBeCloseTo(2.5, 5);
  });
});

describe('nextIntervalDays', () => {
  it('resets to 1 day on q<3 (lapse)', () => {
    expect(
      nextIntervalDays({
        quality: 2,
        previousIntervalDays: 30,
        previousPracticeCount: 5,
        easeFactor: 2.5,
      }),
    ).toBe(1);
  });

  it('first success → 1 day', () => {
    expect(
      nextIntervalDays({
        quality: 5,
        previousIntervalDays: 0,
        previousPracticeCount: 0,
        easeFactor: 2.5,
      }),
    ).toBe(1);
  });

  it('second success → 6 days', () => {
    expect(
      nextIntervalDays({
        quality: 4,
        previousIntervalDays: 1,
        previousPracticeCount: 1,
        easeFactor: 2.5,
      }),
    ).toBe(6);
  });

  it('thereafter multiplies by EF (rounded up)', () => {
    expect(
      nextIntervalDays({
        quality: 5,
        previousIntervalDays: 6,
        previousPracticeCount: 2,
        easeFactor: 2.5,
      }),
    ).toBe(15);
  });

  it('caps at maxIntervalDays', () => {
    expect(
      nextIntervalDays({
        quality: 5,
        previousIntervalDays: 200,
        previousPracticeCount: 10,
        easeFactor: 2.6,
      }),
    ).toBe(SRS_BOUNDS.maxIntervalDays);
  });
});

describe('nextMastery', () => {
  it('moves toward the new score with alpha weight', () => {
    expect(nextMastery(0, 100)).toBe(30);
    expect(nextMastery(50, 100)).toBe(65);
    expect(nextMastery(100, 0)).toBe(70);
  });

  it('clamps to [0,100]', () => {
    expect(nextMastery(0, 0)).toBe(0);
    expect(nextMastery(100, 100)).toBe(100);
  });
});

describe('applyReview', () => {
  it('initialises from never-practiced state on a perfect score', () => {
    const next = applyReview(initialReviewState(), { score: 100, correct: true, now: NOW });
    expect(next.practiceCount).toBe(1);
    expect(next.streak).toBe(1);
    expect(next.intervalDays).toBe(1);
    expect(next.easeFactor).toBeCloseTo(2.6, 5);
    expect(next.lastPracticed).toEqual(NOW);
    expect(next.nextReview?.toISOString()).toBe('2026-05-09T12:00:00.000Z');
  });

  it('resets streak and interval on a wrong answer', () => {
    const seeded = {
      practiceCount: 4,
      streak: 4,
      mastery: 80,
      easeFactor: 2.5,
      intervalDays: 30,
      lastPracticed: NOW,
      nextReview: NOW,
    };
    const next = applyReview(seeded, { score: 10, correct: false, now: NOW });
    expect(next.streak).toBe(0);
    expect(next.intervalDays).toBe(1);

    expect(next.easeFactor).toBeLessThan(2.5);
  });

  it('clamps out-of-range scores', () => {
    const next = applyReview(initialReviewState(), { score: 500, correct: true, now: NOW });
    expect(next.mastery).toBeLessThanOrEqual(100);
  });
});

describe('isDue', () => {
  it('treats never-practiced nodes as due', () => {
    expect(isDue({ nextReview: null }, NOW)).toBe(true);
  });

  it('is due when nextReview is in the past', () => {
    expect(isDue({ nextReview: new Date(NOW.getTime() - 1000) }, NOW)).toBe(true);
  });

  it('is not due when nextReview is in the future', () => {
    expect(isDue({ nextReview: new Date(NOW.getTime() + 1000) }, NOW)).toBe(false);
  });
});
