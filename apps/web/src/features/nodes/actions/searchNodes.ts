'use server';

import {
  getDb,
  nodes,
  rooms,
  and,
  desc,
  eq,
  getTableColumns,
  isNull,
  sql,
  type SQL,
} from '@memory-palace/db';
import { defineAction } from '@/shared/lib/action';
import { searchNodesSchema } from '../schemas/node';

// websearch_to_tsquery accepts AND/OR/-negation syntax and is forgiving of
// user input — safer than to_tsquery, more expressive than plainto_tsquery.
// The expression must match the GIN index `idx_nodes_fts` exactly to remain
// index-eligible.
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

    const db = getDb();
    let q = db.select(getTableColumns(nodes)).from(nodes).$dynamic();

    if (palaceId) {
      // Inner-joining rooms (and filtering deleted ones) prevents soft-deleted
      // rooms from leaking their nodes into search results.
      q = q.innerJoin(
        rooms,
        and(eq(rooms.id, nodes.roomId), eq(rooms.palaceId, palaceId), isNull(rooms.deletedAt))!,
      );
    }

    return q
      .where(and(...conditions))
      .orderBy(sql`ts_rank(${FTS_VECTOR}, ${ftsQuery}) DESC`, desc(nodes.createdAt))
      .limit(limit);
  },
});
