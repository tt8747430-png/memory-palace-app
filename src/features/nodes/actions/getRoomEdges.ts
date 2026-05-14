'use server';

import { getDb, edges, nodes, eq, and } from '@/db';
import { defineAction } from '@/shared/lib/action';
import { getRoomEdgesSchema } from '../schemas/node';

export const getRoomEdges = defineAction({
  name: 'getRoomEdges',
  schema: getRoomEdgesSchema,
  handler: async ({ user, input }) => {
    return getDb()
      .select({
        id: edges.id,
        sourceNodeId: edges.sourceNodeId,
        targetNodeId: edges.targetNodeId,
        label: edges.label,
        createdAt: edges.createdAt,
      })
      .from(edges)
      .innerJoin(
        nodes,
        and(
          eq(edges.sourceNodeId, nodes.id),
          eq(nodes.roomId, input.roomId),
          eq(nodes.userId, user.id),
        ),
      );
  },
});
