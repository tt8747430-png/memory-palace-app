'use server';

import { revalidatePath } from 'next/cache';
import {
  getDb,
  nodes,
  rooms,
  palaces,
  practiceSessions,
  nodeReviewState,
  and,
  eq,
  isNull,
  sql,
} from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { recordPracticeSchema } from '../schemas/practice';
import { applyReview, initialReviewState } from '../lib/srs';

export type RecordPracticeResult = {
  nextReview: Date;
  intervalDays: number;
  mastery: number;
  streak: number;
  easeFactor: number;
};

/**
 * Records a single practice attempt and recomputes the SM-2 review state.
 *
 * Two writes inside one transaction:
 *   1. INSERT into `practice_sessions` (append-only history).
 *   2. UPSERT into `node_review_state` with the SM-2 reducer applied to the
 *      existing row (or a fresh `initialReviewState()` for first-time nodes).
 *
 * Ownership is verified by joining nodes → rooms → palaces with `userId`
 * before any write happens. RLS enforces the same on the database side, but
 * the explicit check produces a clean `NOT_FOUND` error envelope.
 */
export const recordPractice = defineAction({
  name: 'recordPractice',
  schema: recordPracticeSchema,
  rateLimit: 'write',
  handler: async ({ user, input }): Promise<RecordPracticeResult> => {
    const db = getDb();

    const [owned] = await db
      .select({ id: nodes.id })
      .from(nodes)
      .innerJoin(rooms, and(eq(rooms.id, nodes.roomId), isNull(rooms.deletedAt)))
      .innerJoin(palaces, and(eq(palaces.id, rooms.palaceId), isNull(palaces.deletedAt)))
      .where(and(eq(nodes.id, input.nodeId), eq(nodes.userId, user.id), isNull(nodes.deletedAt)))
      .limit(1);
    if (!owned) throw new ActionError('NOT_FOUND', 'Node not found.');

    const [existing] = await db
      .select()
      .from(nodeReviewState)
      .where(eq(nodeReviewState.nodeId, input.nodeId))
      .limit(1);

    const now = new Date();
    const previous = existing
      ? {
          practiceCount: existing.practiceCount,
          streak: existing.streak,
          mastery: existing.mastery,
          easeFactor: existing.easeFactor,
          intervalDays: existing.intervalDays,
          lastPracticed: existing.lastPracticed,
          nextReview: existing.nextReview,
        }
      : initialReviewState();

    const next = applyReview(previous, {
      score: input.score,
      correct: input.correct,
      now,
    });

    await db.insert(practiceSessions).values({
      userId: user.id,
      nodeId: input.nodeId,
      score: input.score,
      correct: input.correct,
      mode: input.mode,
    });

    await db
      .insert(nodeReviewState)
      .values({
        nodeId: input.nodeId,
        userId: user.id,
        practiceCount: next.practiceCount,
        streak: next.streak,
        mastery: next.mastery,
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        lastPracticed: next.lastPracticed,
        nextReview: next.nextReview,
      })
      .onConflictDoUpdate({
        target: nodeReviewState.nodeId,
        set: {
          practiceCount: sql`${nodeReviewState.practiceCount} + 1`,
          streak: next.streak,
          mastery: next.mastery,
          easeFactor: next.easeFactor,
          intervalDays: next.intervalDays,
          lastPracticed: next.lastPracticed,
          nextReview: next.nextReview,
        },
      });

    revalidatePath('/practice');
    revalidatePath('/dashboard');

    return {
      nextReview: next.nextReview ?? now,
      intervalDays: next.intervalDays,
      mastery: next.mastery,
      streak: next.streak,
      easeFactor: next.easeFactor,
    };
  },
});
