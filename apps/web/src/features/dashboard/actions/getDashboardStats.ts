'use server';

import { getDb, palaces, rooms, nodes, sql } from '@memory-palace/db';
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

    // Single query with three independent sub-counts joined as a lateral.
    // Avoids three separate round-trips while remaining readable.
    const [row] = await db.execute<{
      palace_count: string;
      room_count: string;
      node_count: string;
    }>(sql`
      SELECT
        (
          SELECT COUNT(*)::text
          FROM ${palaces}
          WHERE ${palaces.userId} = ${user.id}
            AND ${palaces.deletedAt} IS NULL
        ) AS palace_count,
        (
          SELECT COUNT(*)::text
          FROM ${rooms}
          INNER JOIN ${palaces} ON ${rooms.palaceId} = ${palaces.id}
          WHERE ${palaces.userId} = ${user.id}
            AND ${rooms.deletedAt} IS NULL
            AND ${palaces.deletedAt} IS NULL
        ) AS room_count,
        (
          SELECT COUNT(*)::text
          FROM ${nodes}
          WHERE ${nodes.userId} = ${user.id}
            AND ${nodes.deletedAt} IS NULL
        ) AS node_count
    `);

    return {
      palaceCount: Number(row?.palace_count ?? 0),
      roomCount: Number(row?.room_count ?? 0),
      nodeCount: Number(row?.node_count ?? 0),
    };
  },
});
