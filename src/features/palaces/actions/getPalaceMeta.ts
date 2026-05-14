'use server';

import {
  getDb,
  palaces,
  rooms,
  nodes,
  practiceSessions,
  nodeReviewState,
  and,
  count,
  eq,
  isNull,
  sql,
} from '@/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { palaceIdSchema } from '../schemas/palace';

export type PalaceMeta = {
  roomCount: number;
  nodeCount: number;
  lastPracticedAt: Date | null;
  masteredCount: number;
};

export const getPalaceMeta = defineAction({
  name: 'getPalaceMeta',
  schema: palaceIdSchema,
  handler: async ({ user, input }): Promise<PalaceMeta> => {
    const db = getDb();

    const [palaceRow] = await db
      .select({ id: palaces.id })
      .from(palaces)
      .where(and(eq(palaces.id, input.id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .limit(1);
    if (!palaceRow) throw new ActionError('NOT_FOUND', 'Palace not found.');

    const [roomRow, nodeRow, lastRow, masteryRow] = await Promise.all([
      db
        .select({ value: count() })
        .from(rooms)
        .where(and(eq(rooms.palaceId, input.id), isNull(rooms.deletedAt))),
      db
        .select({ value: count() })
        .from(nodes)
        .innerJoin(rooms, eq(rooms.id, nodes.roomId))
        .where(and(eq(rooms.palaceId, input.id), isNull(nodes.deletedAt), isNull(rooms.deletedAt))),
      db
        .select({ at: sql<Date | null>`MAX(${practiceSessions.practicedAt})` })
        .from(practiceSessions)
        .innerJoin(nodes, eq(nodes.id, practiceSessions.nodeId))
        .innerJoin(rooms, eq(rooms.id, nodes.roomId))
        .where(and(eq(rooms.palaceId, input.id), eq(practiceSessions.userId, user.id))),
      db
        .select({
          mastered: sql<number>`COALESCE(SUM(CASE WHEN ${nodeReviewState.mastery} >= 80 THEN 1 ELSE 0 END), 0)::int`,
        })
        .from(nodeReviewState)
        .innerJoin(nodes, eq(nodes.id, nodeReviewState.nodeId))
        .innerJoin(rooms, eq(rooms.id, nodes.roomId))
        .where(and(eq(rooms.palaceId, input.id), eq(nodeReviewState.userId, user.id))),
    ]);

    return {
      roomCount: roomRow[0]?.value ?? 0,
      nodeCount: nodeRow[0]?.value ?? 0,
      lastPracticedAt: lastRow[0]?.at ?? null,
      masteredCount: masteryRow[0]?.mastered ?? 0,
    };
  },
});
