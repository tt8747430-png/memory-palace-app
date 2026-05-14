'use server';

import {
  getDb,
  practiceSessions,
  nodes,
  rooms,
  palaces,
  and,
  desc,
  eq,
  isNull,
} from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { roomIdSchema } from '../schemas/room';

export type RoomActivityRow = {
  id: string;
  nodeTitle: string;
  mode: 'multiple-choice' | 'typed-recall' | 'flashcard';
  correct: boolean;
  score: number;
  practicedAt: Date;
};

const LIMIT = 8;

export const getRoomRecentActivity = defineAction({
  name: 'getRoomRecentActivity',
  schema: roomIdSchema,
  handler: async ({ user, input }): Promise<RoomActivityRow[]> => {
    const db = getDb();

    const [room] = await db
      .select({ id: rooms.id })
      .from(rooms)
      .innerJoin(
        palaces,
        and(eq(rooms.palaceId, palaces.id), eq(palaces.userId, user.id), isNull(palaces.deletedAt)),
      )
      .where(
        and(eq(rooms.id, input.id), eq(rooms.palaceId, input.palaceId), isNull(rooms.deletedAt)),
      )
      .limit(1);
    if (!room) throw new ActionError('NOT_FOUND', 'Room not found.');

    return db
      .select({
        id: practiceSessions.id,
        nodeTitle: nodes.title,
        mode: practiceSessions.mode,
        correct: practiceSessions.correct,
        score: practiceSessions.score,
        practicedAt: practiceSessions.practicedAt,
      })
      .from(practiceSessions)
      .innerJoin(nodes, eq(nodes.id, practiceSessions.nodeId))
      .where(and(eq(nodes.roomId, input.id), eq(practiceSessions.userId, user.id)))
      .orderBy(desc(practiceSessions.practicedAt))
      .limit(LIMIT);
  },
});
