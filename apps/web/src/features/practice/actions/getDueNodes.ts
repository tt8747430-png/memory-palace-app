'use server';

import {
  getDb,
  nodes,
  rooms,
  palaces,
  nodeReviewState,
  and,
  asc,
  eq,
  isNull,
  or,
  isNotNull,
  lte,
  sql,
  type SQL,
} from '@memory-palace/db';
import { defineAction } from '@/shared/lib/action';
import { getDueNodesSchema } from '../schemas/practice';

export type DueNodeWithMeta = {
  id: string;
  title: string;
  content: string | null;
  /** Optional Bible-mode hint — surfaced in flashcards/journey when palace.mode === 'bible'. */
  verseHint: string | null;
  bibleRef: string | null;
  roomId: string;
  palaceId: string;
  palaceTitle: string;
  /** Parent palace mode — drives whether verse-hint UI renders. */
  palaceMode: 'bible' | 'simple';
  roomTitle: string;
  mastery: number;
  streak: number;
  practiceCount: number;
  nextReview: Date | null;
  /** True when this node has never been practiced — always counted as due. */
  neverPracticed: boolean;
};

/**
 * Returns nodes whose `nextReview` is past (or never set), oldest-due first.
 *
 * Uses a LEFT JOIN to `node_review_state` so unpracticed nodes surface in the
 * queue too. Ordering is `(next_review nulls first, created_at)` to mix new
 * material with overdue reviews fairly.
 */
export const getDueNodes = defineAction({
  name: 'getDueNodes',
  schema: getDueNodesSchema,
  handler: async ({ user, input }) => {
    const db = getDb();
    const now = new Date();

    const conditions: SQL[] = [
      eq(nodes.userId, user.id),
      isNull(nodes.deletedAt),
      isNull(rooms.deletedAt),
      isNull(palaces.deletedAt),
    ];
    if (input?.roomId) conditions.push(eq(nodes.roomId, input.roomId));
    if (input?.palaceId) conditions.push(eq(rooms.palaceId, input.palaceId));

    // Due predicate: never-practiced (no review row) OR nextReview <= now.
    const duePredicate = or(
      isNull(nodeReviewState.nodeId),
      and(isNotNull(nodeReviewState.nextReview), lte(nodeReviewState.nextReview, now)),
    );
    if (duePredicate) conditions.push(duePredicate);

    const rows = await db
      .select({
        id: nodes.id,
        title: nodes.title,
        content: nodes.content,
        verseHint: nodes.verseHint,
        bibleRef: nodes.bibleRef,
        roomId: nodes.roomId,
        palaceId: rooms.palaceId,
        palaceTitle: palaces.title,
        palaceMode: palaces.mode,
        roomTitle: rooms.title,
        mastery: nodeReviewState.mastery,
        streak: nodeReviewState.streak,
        practiceCount: nodeReviewState.practiceCount,
        nextReview: nodeReviewState.nextReview,
      })
      .from(nodes)
      .innerJoin(rooms, eq(rooms.id, nodes.roomId))
      .innerJoin(palaces, eq(palaces.id, rooms.palaceId))
      .leftJoin(
        nodeReviewState,
        and(eq(nodeReviewState.nodeId, nodes.id), eq(nodeReviewState.userId, user.id)),
      )
      .where(and(...conditions))
      .orderBy(
        // nulls first means never-practiced come first; then oldest due.
        sql`${nodeReviewState.nextReview} ASC NULLS FIRST`,
        asc(nodes.createdAt),
        asc(nodes.id),
      )
      .limit(input?.limit ?? 20);

    return rows.map<DueNodeWithMeta>((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      verseHint: r.verseHint,
      bibleRef: r.bibleRef,
      roomId: r.roomId,
      palaceId: r.palaceId,
      palaceTitle: r.palaceTitle,
      palaceMode: r.palaceMode,
      roomTitle: r.roomTitle,
      mastery: r.mastery ?? 0,
      streak: r.streak ?? 0,
      practiceCount: r.practiceCount ?? 0,
      nextReview: r.nextReview,
      neverPracticed: r.nextReview === null,
    }));
  },
});
