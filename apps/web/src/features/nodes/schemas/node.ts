import { z } from 'zod';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const TITLE_MAX = 200;
const CONTENT_MAX = 10_000;
const COLOR_MAX = 20;

const NODE_TYPES = ['text', 'image', 'link'] as const;

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

export const getRoomNodesSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
});

export const createNodeSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(TITLE_MAX, `Title must be ${TITLE_MAX} characters or less`),
  content: z
    .string()
    .max(CONTENT_MAX, `Content must be ${CONTENT_MAX} characters or less`)
    .optional(),
  nodeType: z.enum(NODE_TYPES).optional().default('text'),
  positionX: z.number().finite('positionX must be finite').optional().default(0),
  positionY: z.number().finite('positionY must be finite').optional().default(0),
  color: z.string().max(COLOR_MAX).optional(),
});

export const updateNodeSchema = z.object({
  id: z.string().uuid('Invalid node ID'),
  roomId: z.string().uuid('Invalid room ID'),
  title: z.string().min(1, 'Title cannot be empty').max(TITLE_MAX).optional(),
  content: z.string().max(CONTENT_MAX).nullable().optional(),
  nodeType: z.enum(NODE_TYPES).optional(),
  color: z.string().max(COLOR_MAX).nullable().optional(),
});

export const updateNodePositionSchema = z.object({
  id: z.string().uuid('Invalid node ID'),
  roomId: z.string().uuid('Invalid room ID'),
  positionX: z.number().finite('positionX must be finite'),
  positionY: z.number().finite('positionY must be finite'),
});

export const deleteNodeSchema = z.object({
  id: z.string().uuid('Invalid node ID'),
  roomId: z.string().uuid('Invalid room ID'),
});

export type GetNodesByRoomInput = z.infer<typeof getNodesByRoomSchema>;
export type SearchNodesInput = z.infer<typeof searchNodesSchema>;
export type GetRoomNodesInput = z.infer<typeof getRoomNodesSchema>;
export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
export type UpdateNodePositionInput = z.infer<typeof updateNodePositionSchema>;
export type DeleteNodeInput = z.infer<typeof deleteNodeSchema>;
