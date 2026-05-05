'use server';

import { revalidatePath } from 'next/cache';
import { getDb, palaces, rooms, nodes } from '@memory-palace/db';
import { ActionError, defineAction } from '@/shared/lib/action';
import { importInputSchema, exportDataSchemaV1 } from '../schemas/dataTransfer';

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
    // ── Parse and structurally validate ──────────────────────────────────────
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
    const stats: ImportStats = { palaces: 0, rooms: 0, nodes: 0 };

    // ── Insert everything in a single transaction ─────────────────────────
    // ON CONFLICT DO NOTHING makes re-imports idempotent — importing the same
    // file twice is harmless because all IDs are preserved from the export.
    // user_id is always set from the authenticated session, never from the file.
    await getDb().transaction(async (tx) => {
      for (const palace of exportData.palaces) {
        await tx
          .insert(palaces)
          .values({
            id: palace.id,
            userId: user.id,
            title: palace.title,
            description: palace.description ?? null,
          })
          .onConflictDoNothing();
        stats.palaces++;

        for (const room of palace.rooms) {
          await tx
            .insert(rooms)
            .values({
              id: room.id,
              palaceId: palace.id,
              title: room.title,
              position: room.position,
            })
            .onConflictDoNothing();
          stats.rooms++;

          for (const node of room.nodes) {
            await tx
              .insert(nodes)
              .values({
                id: node.id,
                roomId: room.id,
                // user_id is always sourced from the session — never from the file
                userId: user.id,
                title: node.title,
                content: node.content ?? null,
                nodeType: node.nodeType,
                positionX: node.positionX,
                positionY: node.positionY,
                color: node.color ?? null,
              })
              .onConflictDoNothing();
            stats.nodes++;
          }
        }
      }
    });

    revalidatePath('/');
    revalidatePath('/palaces');
    return stats;
  },
});
