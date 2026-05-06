'use server';

import { getDb, edges, nodes, eq, and } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { deleteEdgeSchema } from '../schemas/node';

export const deleteEdge = defineAction({
  name: 'deleteEdge',
  schema: deleteEdgeSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const db = getDb();

    // Verify the edge exists and its source node belongs to the user in this room.
    const [edge] = await db
      .select({ id: edges.id })
      .from(edges)
      .innerJoin(
        nodes,
        and(
          eq(edges.sourceNodeId, nodes.id),
          eq(nodes.userId, user.id),
          eq(nodes.roomId, input.roomId),
        ),
      )
      .where(eq(edges.id, input.id))
      .limit(1);

    if (!edge) throw new ActionError('NOT_FOUND', 'Edge not found.');

    await db.delete(edges).where(eq(edges.id, edge.id));

    return { id: edge.id };
  },
});
