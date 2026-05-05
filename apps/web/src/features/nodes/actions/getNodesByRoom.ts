'use server';

import { getDb, nodes, and, desc, eq, isNull, sql, type SQL } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { decodeCursor, encodeCursor } from '@/shared/lib/cursor';
import { getNodesByRoomSchema } from '../schemas/node';

export const getNodesByRoom = defineAction({
  name: 'getNodesByRoom',
  schema: getNodesByRoomSchema,
  handler: async ({ user, input }) => {
    const { roomId, cursor: cursorStr, limit } = input;

    const cursor = cursorStr ? decodeCursor(cursorStr) : null;
    if (cursorStr && !cursor) throw new ActionError('VALIDATION_FAILED', 'Invalid cursor.');

    const conditions: SQL[] = [
      eq(nodes.roomId, roomId),
      eq(nodes.userId, user.id),
      isNull(nodes.deletedAt),
    ];
    if (cursor) {
      // Postgres row comparison uses the composite (created_at, id) index.
      conditions.push(
        sql`(${nodes.createdAt}, ${nodes.id}) < (${cursor.createdAt}::timestamptz, ${cursor.id}::uuid)`,
      );
    }

    // Fetch limit+1 to detect a next page without a separate COUNT query.
    const rows = await getDb()
      .select()
      .from(nodes)
      .where(and(...conditions))
      .orderBy(desc(nodes.createdAt), desc(nodes.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null;
    return { items, nextCursor };
  },
});
