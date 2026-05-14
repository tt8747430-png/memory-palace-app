'use server';

import { revalidatePath } from 'next/cache';
import { getDb, palaces, rooms, nodes } from '@/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { importInputSchema, exportDataSchemaV1 } from '@/features/palaces';

export type ImportStats = {
  palaces: number;
  rooms: number;
  nodes: number;
};

export const importPalaceData = defineAction({
  name: 'importPalaceData',
  schema: importInputSchema,
  rateLimit: 'write',
  handler: async ({ user, input }): Promise<ImportStats> => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input.jsonContent);
    } catch {
      throw new ActionError('VALIDATION_FAILED', 'The file is not valid JSON.');
    }

    const result = exportDataSchemaV1.safeParse(parsed);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const path = firstIssue?.path.join('.') ?? 'unknown';
      throw new ActionError(
        'VALIDATION_FAILED',
        `Invalid export format at "${path}": ${firstIssue?.message ?? 'unknown error'}`,
      );
    }

    const exportData = result.data;

    const palaceValues = exportData.palaces.map((p) => ({
      id: p.id,
      userId: user.id,
      title: p.title,
      description: p.description ?? null,
    }));

    const roomValues = exportData.palaces.flatMap((p) =>
      p.rooms.map((r) => ({
        id: r.id,
        palaceId: p.id,
        title: r.title,
        position: r.position,
      })),
    );

    const nodeValues = exportData.palaces.flatMap((p) =>
      p.rooms.flatMap((r) =>
        r.nodes.map((n) => ({
          id: n.id,
          roomId: r.id,
          userId: user.id,
          title: n.title,
          content: n.content ?? null,
          nodeType: n.nodeType,
          positionX: n.positionX,
          positionY: n.positionY,
          color: n.color ?? null,
        })),
      ),
    );

    const stats = await getDb().transaction(async (tx) => {
      const insertedPalaces =
        palaceValues.length > 0
          ? await tx
              .insert(palaces)
              .values(palaceValues)
              .onConflictDoNothing()
              .returning({ id: palaces.id })
          : [];

      const insertedRooms =
        roomValues.length > 0
          ? await tx
              .insert(rooms)
              .values(roomValues)
              .onConflictDoNothing()
              .returning({ id: rooms.id })
          : [];

      const insertedNodes =
        nodeValues.length > 0
          ? await tx
              .insert(nodes)
              .values(nodeValues)
              .onConflictDoNothing()
              .returning({ id: nodes.id })
          : [];

      return {
        palaces: insertedPalaces.length,
        rooms: insertedRooms.length,
        nodes: insertedNodes.length,
      };
    });

    revalidatePath('/');
    revalidatePath('/palaces');
    return stats;
  },
});
