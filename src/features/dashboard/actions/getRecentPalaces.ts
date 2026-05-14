'use server';

import {
  getDb,
  palaces,
  rooms,
  nodes,
  practiceSessions,
  eq,
  isNull,
  and,
  desc,
  inArray,
  count,
  max,
} from '@/db';
import { defineAction } from '@/shared/lib/action';

export type RecentPalace = {
  id: string;
  title: string;
  description: string | null;
  roomCount: number;
  nodeCount: number;
  lastPracticedAt: Date | null;
};

const LIMIT = 5;

export const getRecentPalaces = defineAction({
  name: 'getRecentPalaces',
  handler: async ({ user }): Promise<RecentPalace[]> => {
    const db = getDb();

    const recent = await db
      .select({
        id: palaces.id,
        title: palaces.title,
        description: palaces.description,
      })
      .from(palaces)
      .where(and(eq(palaces.userId, user.id), isNull(palaces.deletedAt)))
      .orderBy(desc(palaces.updatedAt))
      .limit(LIMIT);

    if (recent.length === 0) return [];

    const ids = recent.map((p) => p.id);

    const [roomRows, nodeRows, practiceRows] = await Promise.all([
      db
        .select({ palaceId: rooms.palaceId, value: count() })
        .from(rooms)
        .where(and(inArray(rooms.palaceId, ids), isNull(rooms.deletedAt)))
        .groupBy(rooms.palaceId),
      db
        .select({ palaceId: rooms.palaceId, value: count() })
        .from(nodes)
        .innerJoin(rooms, eq(rooms.id, nodes.roomId))
        .where(and(inArray(rooms.palaceId, ids), isNull(nodes.deletedAt), isNull(rooms.deletedAt)))
        .groupBy(rooms.palaceId),
      db
        .select({ palaceId: rooms.palaceId, at: max(practiceSessions.practicedAt) })
        .from(practiceSessions)
        .innerJoin(nodes, eq(nodes.id, practiceSessions.nodeId))
        .innerJoin(rooms, eq(rooms.id, nodes.roomId))
        .where(and(inArray(rooms.palaceId, ids), eq(practiceSessions.userId, user.id)))
        .groupBy(rooms.palaceId),
    ]);

    const roomCountByPalace = new Map(roomRows.map((r) => [r.palaceId, r.value]));
    const nodeCountByPalace = new Map(nodeRows.map((r) => [r.palaceId, r.value]));
    const lastPracticedByPalace = new Map(practiceRows.map((r) => [r.palaceId, r.at]));

    return recent.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      roomCount: roomCountByPalace.get(p.id) ?? 0,
      nodeCount: nodeCountByPalace.get(p.id) ?? 0,
      lastPracticedAt: lastPracticedByPalace.get(p.id) ?? null,
    }));
  },
});
