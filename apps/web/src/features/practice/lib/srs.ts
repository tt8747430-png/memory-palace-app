/**
 * SuperMemo-2 (SM-2) reducer for the practice engine.
 *
 * Pure: no I/O, no clocks (the caller passes `now`). Deterministic — same
 * input always returns the same output, which is what makes it unit-testable
 * with table-driven specs.
 *
 * The legacy MemoryPalaces app used a fixed [1, 3, 7, 14, 30, 60, 120] day
 * ladder. SM-2 is what the aspirational FEATURES doc has always specified;
 * we deliberately discard the fixed ladder in favour of the algorithm.
 */

export const SRS_DEFAULTS = {
  easeFactor: 2.5,
  intervalDays: 0,
  practiceCount: 0,
  streak: 0,
  mastery: 0,
} as const;

export const SRS_BOUNDS = {
  /** SM-2 floor — anything lower makes the schedule degenerate. */
  minEaseFactor: 1.3,
  /** Cap intervals at ~6 months — past this point the user has clearly
   *  mastered the node and we don't need monthly precision. */
  maxIntervalDays: 180,
  /** Mastery is exponentially-weighted — recent answers matter more. */
  masteryAlpha: 0.3,
} as const;

export interface ReviewState {
  practiceCount: number;
  streak: number;
  mastery: number;
  easeFactor: number;
  intervalDays: number;
  lastPracticed: Date | null;
  nextReview: Date | null;
}

export interface ReviewInput {
  /** 0–100. Caller is expected to clamp; we clamp again defensively. */
  score: number;
  /** Whether the answer was counted correct (drives streak + SM-2 quality). */
  correct: boolean;
  /** Wall clock — passed in so tests can run deterministically. */
  now: Date;
}

/** Initial state for a node that has never been practiced. */
export function initialReviewState(): ReviewState {
  return {
    practiceCount: SRS_DEFAULTS.practiceCount,
    streak: SRS_DEFAULTS.streak,
    mastery: SRS_DEFAULTS.mastery,
    easeFactor: SRS_DEFAULTS.easeFactor,
    intervalDays: SRS_DEFAULTS.intervalDays,
    lastPracticed: null,
    nextReview: null,
  };
}

/**
 * Apply one practice attempt to a review state.
 *
 * Quality (SM-2 q ∈ {0..5}) is derived from `score` + `correct`:
 * - correct + score ≥ 90 → 5 (perfect)
 * - correct + score ≥ 70 → 4 (good)
 * - correct           → 3 (passed)
 * - !correct + score ≥ 50 → 2 (close)
 * - !correct + score ≥ 25 → 1 (poor)
 * - else                  → 0 (blackout)
 */
export function applyReview(state: ReviewState, input: ReviewInput): ReviewState {
  const score = clamp(Math.round(input.score), 0, 100);
  const quality = qualityFromScore(score, input.correct);

  const easeFactor = nextEaseFactor(state.easeFactor, quality);
  const practiceCount = state.practiceCount + 1;
  const streak = input.correct ? state.streak + 1 : 0;
  const mastery = nextMastery(state.mastery, score);
  const intervalDays = nextIntervalDays({
    quality,
    previousIntervalDays: state.intervalDays,
    previousPracticeCount: state.practiceCount,
    easeFactor,
  });

  return {
    practiceCount,
    streak,
    mastery,
    easeFactor,
    intervalDays,
    lastPracticed: input.now,
    nextReview: addDays(input.now, intervalDays),
  };
}

export function qualityFromScore(score: number, correct: boolean): number {
  if (correct) {
    if (score >= 90) return 5;
    if (score >= 70) return 4;
    return 3;
  }
  if (score >= 50) return 2;
  if (score >= 25) return 1;
  return 0;
}

/**
 * SM-2 EF update:
 *   EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 * Floored at 1.3 (SM-2 spec).
 */
export function nextEaseFactor(easeFactor: number, quality: number): number {
  const q = clamp(quality, 0, 5);
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  return Math.max(SRS_BOUNDS.minEaseFactor, easeFactor + delta);
}

interface IntervalArgs {
  quality: number;
  previousIntervalDays: number;
  previousPracticeCount: number;
  easeFactor: number;
}

/**
 * SM-2 interval rules:
 *   q < 3                → reset to 1 day (lapsed)
 *   first ever success   → 1 day
 *   second success       → 6 days
 *   thereafter           → previous * EF (rounded up)
 */
export function nextIntervalDays(args: IntervalArgs): number {
  const { quality, previousIntervalDays, previousPracticeCount, easeFactor } = args;
  if (quality < 3) return 1;
  if (previousPracticeCount === 0) return 1;
  if (previousPracticeCount === 1) return 6;
  const next = Math.ceil(Math.max(1, previousIntervalDays) * easeFactor);
  return Math.min(next, SRS_BOUNDS.maxIntervalDays);
}

/** Exponentially-weighted moving average over [0, 100]. */
export function nextMastery(previous: number, score: number): number {
  const a = SRS_BOUNDS.masteryAlpha;
  return clamp(Math.round((1 - a) * previous + a * score), 0, 100);
}

export function addDays(from: Date, days: number): Date {
  const ms = from.getTime() + days * 86_400_000;
  return new Date(ms);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Whether a node is currently due for review.
 * Never-practiced nodes (no `nextReview`) are always due.
 */
export function isDue(state: Pick<ReviewState, 'nextReview'>, now: Date): boolean {
  if (!state.nextReview) return true;
  return state.nextReview.getTime() <= now.getTime();
}
