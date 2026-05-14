'use server';

import { getDb, nodes, rooms, and, desc, eq, getTableColumns, isNull, sql, type SQL } from '@/db';
import { defineAction } from '@/shared/lib/action';
import { searchNodesSchema } from '../schemas/node';

const FTS_VECTOR = sql`to_tsvector('english', coalesce(${nodes.title}, '') || ' ' || coalesce(${nodes.content}, ''))`;

export const searchNodes = defineAction({
  name: 'searchNodes',
  schema: searchNodesSchema,
  rateLimit: 'search',
  handler: async ({ user, input }) => {
    const { query, palaceId, limit } = input;
    const ftsQuery = sql`websearch_to_tsquery('english', ${query})`;

    const conditions: SQL[] = [
      eq(nodes.userId, user.id),
      isNull(nodes.deletedAt),
      sql`${FTS_VECTOR} @@ ${ftsQuery}`,
    ];

    if (palaceId) {
      conditions.push(eq(rooms.palaceId, palaceId));
    }

    const db = getDb();

    return db
      .select({
        ...getTableColumns(nodes),
        palaceId: rooms.palaceId,
      })
      .from(nodes)
      .innerJoin(rooms, and(eq(rooms.id, nodes.roomId), isNull(rooms.deletedAt))!)
      .where(and(...conditions))
      .orderBy(sql`ts_rank(${FTS_VECTOR}, ${ftsQuery}) DESC`, desc(nodes.createdAt))
      .limit(limit);
  },
});
