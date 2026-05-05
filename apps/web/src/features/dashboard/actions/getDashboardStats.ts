'use server';

import { getDb, palaces, rooms, nodes, count, eq, isNull, and } from '@memory-palace/db';
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

    const [palaceRow, roomRow, nodeRow] = await Promise.all([
      db
        .select({ value: count() })
        .from(palaces)
        .where(and(eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
        .then((r) => r[0]),
      db
        .select({ value: count() })
        .from(rooms)
        .innerJoin(palaces, eq(rooms.palaceId, palaces.id))
        .where(and(eq(palaces.userId, user.id), isNull(rooms.deletedAt), isNull(palaces.deletedAt)))
        .then((r) => r[0]),
      db
        .select({ value: count() })
        .from(nodes)
        .where(and(eq(nodes.userId, user.id), isNull(nodes.deletedAt)))
        .then((r) => r[0]),
    ]);

    return {
      palaceCount: palaceRow?.value ?? 0,
      roomCount: roomRow?.value ?? 0,
      nodeCount: nodeRow?.value ?? 0,
    };
  },
});
