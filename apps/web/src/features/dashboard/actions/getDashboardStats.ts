'use server';

import { getDb, palaces, rooms, nodes, count, and, eq, isNull } from '@memory-palace/db';
import { defineAction } from '@/shared/lib/action';

export type DashboardStats = {
  palaceCount: number;
  roomCount: number;
  nodeCount: number;
};

export const getDashboardStats = defineAction({
  name: 'getDashboardStats',
  handler: async ({ user }): Promise<DashboardStats> => {
    const db = getDb();

    // Three parallel count queries — Drizzle's count() returns a typed number
    // directly, avoiding the COUNT(*)::text → Number() cast the raw sql`` form
    // requires. Promise.all keeps wall-clock time equivalent to the prior
    // single-query form over a pooled connection.
    const [palaceRow, roomRow, nodeRow] = await Promise.all([
      db
        .select({ value: count() })
        .from(palaces)
        .where(and(eq(palaces.userId, user.id), isNull(palaces.deletedAt))),
      db
        .select({ value: count() })
        .from(rooms)
        .innerJoin(palaces, eq(rooms.palaceId, palaces.id))
        .where(
          and(eq(palaces.userId, user.id), isNull(rooms.deletedAt), isNull(palaces.deletedAt)),
        ),
      db
        .select({ value: count() })
        .from(nodes)
        .where(and(eq(nodes.userId, user.id), isNull(nodes.deletedAt))),
    ]);

    return {
      palaceCount: palaceRow[0]?.value ?? 0,
      roomCount: roomRow[0]?.value ?? 0,
      nodeCount: nodeRow[0]?.value ?? 0,
    };
  },
});
