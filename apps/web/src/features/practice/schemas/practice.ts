import { z } from 'zod';

const SCORE_MIN = 0;
const SCORE_MAX = 100;
const DUE_LIMIT_DEFAULT = 20;
const DUE_LIMIT_MAX = 50;

export const PRACTICE_MODES = ['multiple-choice', 'typed-recall', 'flashcard'] as const;

export const getDueNodesSchema = z
  .object({
    /** Optional palace scope; when omitted, the queue spans all the user's palaces. */
    palaceId: z.string().uuid('Invalid palace ID').optional(),
    /** Optional room scope (overrides palaceId). */
    roomId: z.string().uuid('Invalid room ID').optional(),
    limit: z.number().int().min(1).max(DUE_LIMIT_MAX).optional().default(DUE_LIMIT_DEFAULT),
    /** Opaque cursor from a previous page (see `shared/lib/cursor.ts`). */
    cursor: z.string().optional(),
  })
  .strict();

export const recordPracticeSchema = z
  .object({
    nodeId: z.string().uuid('Invalid node ID'),
    score: z
      .number()
      .int('Score must be an integer')
      .min(SCORE_MIN, `Score must be at least ${SCORE_MIN}`)
      .max(SCORE_MAX, `Score must be at most ${SCORE_MAX}`),
    correct: z.boolean(),
    mode: z.enum(PRACTICE_MODES),
  })
  .strict();

export const getPracticeStatsSchema = z.object({}).optional();

export type GetDueNodesInput = z.infer<typeof getDueNodesSchema>;
export type RecordPracticeInput = z.infer<typeof recordPracticeSchema>;
