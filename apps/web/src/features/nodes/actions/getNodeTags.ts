'use server';

import { getDb, tags, nodeTags, nodes, eq, and, isNull } from '@memory-palace/db';
import { defineAction } from '@/shared/lib/action';
import { getNodeTagsSchema } from '../schemas/node';

export const getNodeTags = defineAction({
  name: 'getNodeTags',
  schema: getNodeTagsSchema,
  handler: async ({ user, input }) => {
    // Join to nodes to verify ownership.
    return getDb()
      .select({ id: tags.id, name: tags.name })
      .from(nodeTags)
      .innerJoin(tags, eq(nodeTags.tagId, tags.id))
      .innerJoin(
        nodes,
        and(eq(nodeTags.nodeId, nodes.id), eq(nodes.userId, user.id), isNull(nodes.deletedAt)),
      )
      .where(eq(nodeTags.nodeId, input.nodeId));
  },
});
