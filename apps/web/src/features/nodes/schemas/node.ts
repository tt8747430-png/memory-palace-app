import { z } from 'zod';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const getNodesByRoomSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).optional().default(DEFAULT_PAGE_SIZE),
});

export const searchNodesSchema = z.object({
  query: z
    .string()
    .min(1, 'Query cannot be empty')
    .max(200, 'Query must be 200 characters or less'),
  palaceId: z.string().uuid('Invalid palace ID').optional(),
  limit: z.number().int().min(1).max(50).optional().default(DEFAULT_PAGE_SIZE),
});

export type GetNodesByRoomInput = z.infer<typeof getNodesByRoomSchema>;
export type SearchNodesInput = z.infer<typeof searchNodesSchema>;
