'use server';

import { z } from 'zod';
import { getDb, nodes, rooms, palaces, and, eq, isNull, ne, sql } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';

const schema = z.object({ nodeId: z.string().uuid('Invalid node ID') }).strict();

export type QuestionContext = {
  distractors: string[];
};

const SAMPLE_LIMIT = 3;

export const getQuestionContext = defineAction({
  name: 'getQuestionContext',
  schema,
  handler: async ({ user, input }): Promise<QuestionContext> => {
    const db = getDb();

    const [target] = await db
      .select({ roomId: nodes.roomId })
      .from(nodes)
      .innerJoin(rooms, and(eq(rooms.id, nodes.roomId), isNull(rooms.deletedAt)))
      .innerJoin(palaces, and(eq(palaces.id, rooms.palaceId), isNull(palaces.deletedAt)))
      .where(and(eq(nodes.id, input.nodeId), eq(nodes.userId, user.id), isNull(nodes.deletedAt)))
      .limit(1);
    if (!target) throw new ActionError('NOT_FOUND', 'Node not found.');

    const rows = await db
      .select({ title: nodes.title })
      .from(nodes)
      .where(
        and(
          eq(nodes.roomId, target.roomId),
          eq(nodes.userId, user.id),
          ne(nodes.id, input.nodeId),
          isNull(nodes.deletedAt),
        ),
      )
      .orderBy(sql`random()`)
      .limit(SAMPLE_LIMIT);

    const seen = new Set<string>();
    const distractors: string[] = [];
    for (const row of rows) {
      const t = row.title.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      distractors.push(t);
    }
    return { distractors };
  },
});
