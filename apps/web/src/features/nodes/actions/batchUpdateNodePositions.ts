'use server';

import { getDb, nodes, sql, eq, and, isNull } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { batchUpdateNodePositionsSchema } from '../schemas/node';

/**
 * Atomically persists XY coordinates for multiple nodes after a multi-select
 * drag. A single UPDATE … FROM (VALUES …) statement covers all rows in one
 * round-trip, then a RETURNING clause lets us verify that every requested node
 * was found and owned by the caller — if the count is short, the transaction
 * rolls back automatically via the thrown ActionError.
 */
export const batchUpdateNodePositions = defineAction({
  name: 'batchUpdateNodePositions',
  schema: batchUpdateNodePositionsSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const { roomId, updates } = input;

    // Build a typed VALUES list so Postgres knows the column types up-front.
    const rows = updates.map(
      ({ id, positionX, positionY }) =>
        sql`(${id}::uuid, ${positionX}::float8, ${positionY}::float8)`,
    );

    const updated = await getDb()
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

    // Roll back if any node was not found or did not belong to the caller.
    if (updated.length !== updates.length) {
      throw new ActionError(
        'NOT_FOUND',
        `Expected to update ${updates.length} nodes but matched ${updated.length}.`,
      );
    }

    return { updatedCount: updated.length };
  },
});
