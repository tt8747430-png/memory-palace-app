import { z } from 'zod';

// ─── Per-entity schemas ───────────────────────────────────────────────────────

const exportNodeSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().nullable(),
  nodeType: z.enum(['text', 'image', 'link']),
  positionX: z.number().finite(),
  positionY: z.number().finite(),
  color: z.string().nullable(),
  createdAt: z.string().datetime(),
});

const exportRoomSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  position: z.number().int().min(0),
  createdAt: z.string().datetime(),
  nodes: z.array(exportNodeSchema),
});

const exportPalaceSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  createdAt: z.string().datetime(),
  rooms: z.array(exportRoomSchema),
});

// ─── Top-level versioned payload ─────────────────────────────────────────────

/**
 * Version 1 of the palace export format.
 * Adding a `version` literal allows future format versions to be handled via
 * a discriminated union — old clients gracefully reject unknown versions.
 */
export const exportDataSchemaV1 = z.object({
  version: z.literal('1'),
  exportedAt: z.string().datetime(),
  palaces: z.array(exportPalaceSchema),
});

export type ExportDataV1 = z.infer<typeof exportDataSchemaV1>;
export type ExportPalace = z.infer<typeof exportPalaceSchema>;
export type ExportRoom = z.infer<typeof exportRoomSchema>;
export type ExportNode = z.infer<typeof exportNodeSchema>;

// ─── Import input schema ──────────────────────────────────────────────────────

/**
 * Input for the importPalaceData server action — just the raw file content.
 * The action re-parses the string with exportDataSchemaV1 for full structural
 * validation, so the outer schema only needs to confirm it is a non-empty string.
 */
export const importInputSchema = z.object({
  jsonContent: z
    .string()
    .min(1, 'File content is required')
    .max(
      10 * 1024 * 1024, // 10 MB guard — prevents trivial memory-exhaustion attacks
      'Export file must be 10 MB or smaller.',
    ),
});

export type ImportInput = z.infer<typeof importInputSchema>;
