export const SRS_DEFAULTS = {
  easeFactor: 2.5,
  intervalDays: 0,
  practiceCount: 0,
  streak: 0,
  mastery: 0,
} as const;

export const SRS_BOUNDS = {
  minEaseFactor: 1.3,

  maxIntervalDays: 180,

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
  score: number;

  correct: boolean;

  now: Date;
}

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

export function nextIntervalDays(args: IntervalArgs): number {
  const { quality, previousIntervalDays, previousPracticeCount, easeFactor } = args;
  if (quality < 3) return 1;
  if (previousPracticeCount === 0) return 1;
  if (previousPracticeCount === 1) return 6;
  const next = Math.ceil(Math.max(1, previousIntervalDays) * easeFactor);
  return Math.min(next, SRS_BOUNDS.maxIntervalDays);
}

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

export function isDue(state: Pick<ReviewState, 'nextReview'>, now: Date): boolean {
  if (!state.nextReview) return true;
  return state.nextReview.getTime() <= now.getTime();
}
