'use server';

import { revalidatePath } from 'next/cache';
import { getDb, rooms, and, eq, isNull, sql } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { updateRoomSchema } from '../schemas/room';

export const updateRoom = defineAction({
  name: 'updateRoom',
  schema: updateRoomSchema,
  rateLimit: 'write',
  handler: async ({ user, input }) => {
    const { id, palaceId, ...patch } = input;

    const [updated] = await getDb()
      .update(rooms)
      .set(patch)
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
      .returning();
    if (!updated) throw new ActionError('NOT_FOUND', 'Room not found.');
    revalidatePath(`/palaces/${palaceId}`);
    revalidatePath(`/palaces/${palaceId}/rooms/${id}`);
    return updated;
  },
});
