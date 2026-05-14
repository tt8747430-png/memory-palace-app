'use server';

import { getDb, practiceSessions, nodes, rooms, and, desc, eq } from '@/db';
import { defineAction } from '@/shared/lib/action';
import { palaceIdSchema } from '../schemas/palace';

export type PalaceActivityRow = {
  id: string;
  nodeTitle: string;
  roomTitle: string;
  mode: 'multiple-choice' | 'typed-recall' | 'flashcard';
  correct: boolean;
  score: number;
  practicedAt: Date;
};

const LIMIT = 6;

export const getPalaceRecentActivity = defineAction({
  name: 'getPalaceRecentActivity',
  schema: palaceIdSchema,
  handler: async ({ user, input }): Promise<PalaceActivityRow[]> => {
    const rows = await getDb()
      .select({
        id: practiceSessions.id,
        nodeTitle: nodes.title,
        roomTitle: rooms.title,
        mode: practiceSessions.mode,
        correct: practiceSessions.correct,
        score: practiceSessions.score,
        practicedAt: practiceSessions.practicedAt,
      })
      .from(practiceSessions)
      .innerJoin(nodes, eq(nodes.id, practiceSessions.nodeId))
      .innerJoin(rooms, eq(rooms.id, nodes.roomId))
      .where(and(eq(rooms.palaceId, input.id), eq(practiceSessions.userId, user.id)))
      .orderBy(desc(practiceSessions.practicedAt))
      .limit(LIMIT);

    return rows;
  },
});
