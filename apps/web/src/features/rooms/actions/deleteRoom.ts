'use server';

import { revalidatePath } from 'next/cache';
import { getDb, rooms, and, eq, isNull, sql } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { roomIdSchema } from '../schemas/room';

export const deleteRoom = defineAction({
  name: 'deleteRoom',
  schema: roomIdSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const { id, palaceId } = input;

    const [deleted] = await getDb()
      .update(rooms)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(rooms.id, id),
          eq(rooms.palaceId, palaceId),
          isNull(rooms.deletedAt),
          sql`EXISTS (
            SELECT 1 FROM palaces
            WHERE palaces.id = ${rooms.palaceId}
              AND palaces.user_id = ${user.id}
              AND palaces.deleted_at IS NULL
          )`,
        ),
      )
      .returning({ id: rooms.id });
    if (!deleted) throw new ActionError('NOT_FOUND', 'Room not found.');
    revalidatePath(`/palaces/${palaceId}`);
    return { id: deleted.id };
  },
});
