'use server';

import { getDb, edges, nodes, eq, and, isNull } from '@/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { createEdgeSchema } from '../schemas/node';

export const createEdge = defineAction({
  name: 'createEdge',
  schema: createEdgeSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const db = getDb();

    const owned = await db
      .select({ id: nodes.id })
      .from(nodes)
      .where(
        and(eq(nodes.roomId, input.roomId), eq(nodes.userId, user.id), isNull(nodes.deletedAt)),
      );

    const ownedIds = new Set(owned.map((n) => n.id));
    if (!ownedIds.has(input.sourceNodeId) || !ownedIds.has(input.targetNodeId)) {
      throw new ActionError('NOT_FOUND', 'One or both nodes not found in this room.');
    }
    if (input.sourceNodeId === input.targetNodeId) {
      throw new ActionError('VALIDATION_FAILED', 'Source and target must be different nodes.');
    }

    const [created] = await db
      .insert(edges)
      .values({
        sourceNodeId: input.sourceNodeId,
        targetNodeId: input.targetNodeId,
        label: input.label,
      })
      .onConflictDoNothing()
      .returning({
        id: edges.id,
        sourceNodeId: edges.sourceNodeId,
        targetNodeId: edges.targetNodeId,
        label: edges.label,
        createdAt: edges.createdAt,
      });

    if (!created) {
      const [existing] = await db
        .select({
          id: edges.id,
          sourceNodeId: edges.sourceNodeId,
          targetNodeId: edges.targetNodeId,
          label: edges.label,
          createdAt: edges.createdAt,
        })
        .from(edges)
        .where(
          and(
            eq(edges.sourceNodeId, input.sourceNodeId),
            eq(edges.targetNodeId, input.targetNodeId),
          ),
        )
        .limit(1);
      if (!existing) throw new ActionError('INTERNAL_ERROR', 'Edge insert returned no row.');
      return existing;
    }

    return created;
  },
});
