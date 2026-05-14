'use server';

import { z } from 'zod';
import { getDb, nodes } from '@/db';
import { defineAction } from '@/shared/lib/action';

const schema = z.object({
  roomId: z.uuid({ error: 'Invalid room ID' }),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  content: z.string().max(2000, 'Content must be 2000 characters or less').optional(),
});

export const createWizardNode = defineAction({
  name: 'createWizardNode',
  schema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const [node] = await getDb()
      .insert(nodes)
      .values({
        roomId: input.roomId,
        userId: user.id,
        title: input.title,
        content: input.content ?? null,
        positionX: 100,
        positionY: 100,
      })
      .returning({ id: nodes.id });

    if (!node) throw new Error('Node insert returned no row.');
    return { nodeId: node.id };
  },
});
