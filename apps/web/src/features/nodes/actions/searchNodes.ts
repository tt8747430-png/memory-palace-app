'use server';

import {
  getDb,
  nodes,
  rooms,
  and,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNull,
  sql,
  type SQL,
} from '@memory-palace/db';
import type { SelectNode } from '@memory-palace/db';
import { auth } from '@/shared/lib/supabase';
import { checkRateLimit } from '@/shared/lib/ratelimit';
import type { ActionResponse } from '@/shared/types';
import { searchNodesSchema } from '../schemas/node';

export async function searchNodes(input: unknown): Promise<ActionResponse<SelectNode[]>> {
  const {
    data: { user },
  } = await auth();
  if (!user) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } };
  }

  const { success: rateLimitOk } = await checkRateLimit(user.id, 'search');
  if (!rateLimitOk) {
    return {
      success: false,
      error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please slow down.' },
    };
  }

  const parsed = searchNodesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: parsed.error.issues[0]?.message ?? 'Invalid input.',
      },
    };
  }

  const { query, palaceId, limit } = parsed.data;

  // websearch_to_tsquery supports AND/OR/-negation syntax naturally (Postgres 11+).
  // Safer than to_tsquery which requires exact syntax, more expressive than plainto_tsquery.
  const ftsVector = sql`to_tsvector('english', coalesce(${nodes.title}, '') || ' ' || coalesce(${nodes.content}, ''))`;
  const ftsQuery = sql`websearch_to_tsquery('english', ${query})`;

  try {
    const db = getDb();

    // When palaceId is provided, restrict to rooms that belong to that palace.
    // Use a subquery rather than a JOIN to avoid column selection complexity.
    const conditions: SQL[] = [
      eq(nodes.userId, user.id),
      isNull(nodes.deletedAt),
      sql`${ftsVector} @@ ${ftsQuery}`,
    ];

    if (palaceId) {
      conditions.push(
        inArray(
          nodes.roomId,
          db.select({ id: rooms.id }).from(rooms).where(eq(rooms.palaceId, palaceId)),
        ),
      );
    }

    const results = await db
      .select(getTableColumns(nodes))
      .from(nodes)
      .where(and(...conditions))
      // ts_rank orders by relevance; ties broken by newest first
      .orderBy(sql`ts_rank(${ftsVector}, ${ftsQuery}) DESC`, desc(nodes.createdAt))
      .limit(limit);

    return { success: true, data: results };
  } catch (err) {
    console.error('[searchNodes]', err);
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Search failed.' } };
  }
}
