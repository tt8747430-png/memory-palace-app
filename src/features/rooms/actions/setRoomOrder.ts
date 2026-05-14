'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getDb, rooms, palaces, and, eq, isNull, inArray, sql } from '@/db';
import { ActionError, defineAction } from '@/shared/lib/action';

const setRoomOrderSchema = z.object({
  palaceId: z.uuid({ error: 'Invalid palace ID' }),

  orderedIds: z.array(z.uuid()).min(1).max(500),
});

export const setRoomOrder = defineAction({
  name: 'setRoomOrder',
  schema: setRoomOrderSchema,
  rateLimit: 'write',
  handler: async ({ user, input }): Promise<{ updated: number }> => {
    const db = getDb();

    const owned = await db
      .select({ id: rooms.id })
      .from(rooms)
      .innerJoin(palaces, eq(palaces.id, rooms.palaceId))
      .where(
        and(
          eq(rooms.palaceId, input.palaceId),
          isNull(rooms.deletedAt),
          eq(palaces.userId, user.id),
          isNull(palaces.deletedAt),
        ),
      );

    const ownedIds = new Set(owned.map((r) => r.id));
    const unique = new Set(input.orderedIds);
    if (unique.size !== input.orderedIds.length) {
      throw new ActionError('VALIDATION_FAILED', 'orderedIds contains duplicates.');
    }
    if (ownedIds.size !== input.orderedIds.length) {
      throw new ActionError(
        'VALIDATION_FAILED',
        'orderedIds must list every room in the palace exactly once.',
      );
    }
    for (const id of input.orderedIds) {
      if (!ownedIds.has(id)) {
        throw new ActionError('NOT_FOUND', 'One or more rooms do not belong to this palace.');
      }
    }

    await db.transaction(async (tx) => {
      const cases = input.orderedIds
        .map((id, i) => sql`WHEN ${rooms.id} = ${id} THEN ${i}::int`)
        .reduce((acc, frag) => sql`${acc} ${frag}`, sql``);
      await tx
        .update(rooms)
        .set({ position: sql`CASE ${cases} END` })
        .where(inArray(rooms.id, input.orderedIds));
    });

    revalidatePath(`/palaces/${input.palaceId}`);
    return { updated: input.orderedIds.length };
  },
});
