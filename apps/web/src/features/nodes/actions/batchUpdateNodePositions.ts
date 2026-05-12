'use server';

import { getDb, nodes, sql, eq, and, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { batchUpdateNodePositionsSchema } from '../schemas/node';

export const batchUpdateNodePositions = defineAction({
  name: 'batchUpdateNodePositions',
  schema: batchUpdateNodePositionsSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const { roomId, updates } = input;

    const rows = updates.map(
      ({ id, positionX, positionY }) =>
        sql`(${id}::uuid, ${positionX}::float8, ${positionY}::float8)`,
    );

    const db = getDb();

    const { updatedCount } = await db.transaction(async (tx) => {
      const updated = await tx
        .update(nodes)
        .set({
          positionX: sql`v.px`,
          positionY: sql`v.py`,
        })
        .from(sql`(VALUES ${sql.join(rows, sql`, `)}) AS v(id, px, py)`)
        .where(
          and(
            eq(nodes.id, sql`v.id`),
            eq(nodes.roomId, roomId),
            eq(nodes.userId, user.id),
            isNull(nodes.deletedAt),
          ),
        )
        .returning({ id: nodes.id });

      if (updated.length !== updates.length) {
        throw new ActionError(
          'NOT_FOUND',
          `Expected to update ${updates.length} nodes but matched ${updated.length}.`,
        );
      }

      return { updatedCount: updated.length };
    });

    return { updatedCount };
  },
});
