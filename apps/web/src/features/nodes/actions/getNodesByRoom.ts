'use server';

import { getDb, nodes, and, desc, eq, isNull, sql, type SQL } from '@memory-palace/db';
import type { SelectNode } from '@memory-palace/db';
import { auth } from '@/shared/lib/supabase';
import { decodeCursor, encodeCursor } from '@/shared/lib/cursor';
import type { ActionResponse, CursorPage } from '@/shared/types';
import { getNodesByRoomSchema } from '../schemas/node';

export async function getNodesByRoom(
  input: unknown,
): Promise<ActionResponse<CursorPage<SelectNode>>> {
  const {
    data: { user },
  } = await auth();
  if (!user) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } };
  }

  const parsed = getNodesByRoomSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: parsed.error.issues[0]?.message ?? 'Invalid input.',
      },
    };
  }

  const { roomId, cursor: cursorStr, limit } = parsed.data;

  const cursor = cursorStr ? decodeCursor(cursorStr) : null;
  if (cursorStr && !cursor) {
    return { success: false, error: { code: 'VALIDATION_FAILED', message: 'Invalid cursor.' } };
  }

  try {
    const db = getDb();
    // Fetch limit+1 to detect a next page without a separate COUNT query.
    const conditions: SQL[] = [
      eq(nodes.roomId, roomId),
      eq(nodes.userId, user.id),
      isNull(nodes.deletedAt),
    ];

    if (cursor) {
      // Postgres row comparison: (created_at, id) < (cursor_ts, cursor_id).
      // Equivalent to `created_at < x OR (created_at = x AND id < cursor_id)` but
      // more readable and lets the planner use the composite index efficiently.
      conditions.push(
        sql`(${nodes.createdAt}, ${nodes.id}) < (${cursor.createdAt}::timestamptz, ${cursor.id}::uuid)`,
      );
    }

    const rows = await db
      .select()
      .from(nodes)
      .where(and(...conditions))
      .orderBy(desc(nodes.createdAt), desc(nodes.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const lastItem = items[items.length - 1];
    const nextCursor =
      hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt, id: lastItem.id }) : null;

    return { success: true, data: { items, nextCursor } };
  } catch (err) {
    console.error('[getNodesByRoom]', err);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch nodes.' },
    };
  }
}
