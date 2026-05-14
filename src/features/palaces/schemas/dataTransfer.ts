import { z } from 'zod';

const exportNodeSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(200),
  content: z.string().nullable(),
  nodeType: z.enum(['text', 'image', 'link']),
  positionX: z.number(),
  positionY: z.number(),
  color: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

const exportRoomSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(200),
  position: z.number().int().min(0),
  createdAt: z.iso.datetime(),
  nodes: z.array(exportNodeSchema),
});

const exportPalaceSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  createdAt: z.iso.datetime(),
  rooms: z.array(exportRoomSchema),
});

export const exportDataSchemaV1 = z.object({
  version: z.literal('1'),
  exportedAt: z.iso.datetime(),
  palaces: z.array(exportPalaceSchema),
});

export type ExportDataV1 = z.infer<typeof exportDataSchemaV1>;
export type ExportPalace = z.infer<typeof exportPalaceSchema>;
export type ExportRoom = z.infer<typeof exportRoomSchema>;
export type ExportNode = z.infer<typeof exportNodeSchema>;

export const importInputSchema = z.object({
  jsonContent: z
    .string()
    .min(1, 'File content is required')
    .max(10 * 1024 * 1024, 'Export file must be 10 MB or smaller.'),
});

export type ImportInput = z.infer<typeof importInputSchema>;
