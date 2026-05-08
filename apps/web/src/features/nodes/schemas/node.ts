import { z } from 'zod';

const DEFAULT_PAGE_SIZE = 20;
const TITLE_MAX = 200;
const CONTENT_MAX = 10_000;
const COLOR_MAX = 20;
const VERSE_HINT_MAX = 2_000;
const BIBLE_REF_MAX = 120;

const NODE_TYPES = ['text', 'image', 'link'] as const;

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
  /** Bible-mode optional fields — silently ignored in Simple-mode UI. */
  verseHint: z.string().max(VERSE_HINT_MAX).optional(),
  bibleRef: z.string().max(BIBLE_REF_MAX).optional(),
});

export const updateNodeSchema = z.object({
  id: z.string().uuid('Invalid node ID'),
  roomId: z.string().uuid('Invalid room ID'),
  title: z.string().min(1, 'Title cannot be empty').max(TITLE_MAX).optional(),
  content: z.string().max(CONTENT_MAX).nullable().optional(),
  nodeType: z.enum(NODE_TYPES).optional(),
  color: z.string().max(COLOR_MAX).nullable().optional(),
  verseHint: z.string().max(VERSE_HINT_MAX).nullable().optional(),
  bibleRef: z.string().max(BIBLE_REF_MAX).nullable().optional(),
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

export const batchUpdateNodePositionsSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  updates: z
    .array(
      z.object({
        id: z.string().uuid('Invalid node ID'),
        positionX: z.number().finite('positionX must be finite'),
        positionY: z.number().finite('positionY must be finite'),
      }),
    )
    .min(1, 'Must provide at least one update')
    .max(100, 'Cannot batch-update more than 100 nodes at once'),
});

// ─── Edge schemas ─────────────────────────────────────────────────────────────

export const getRoomEdgesSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
});

export const createEdgeSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  sourceNodeId: z.string().uuid('Invalid source node ID'),
  targetNodeId: z.string().uuid('Invalid target node ID'),
  label: z.string().max(200).optional(),
});

export const deleteEdgeSchema = z.object({
  id: z.string().uuid('Invalid edge ID'),
  roomId: z.string().uuid('Invalid room ID'),
});

// ─── Tag schemas ──────────────────────────────────────────────────────────────

export const getNodeTagsSchema = z.object({
  nodeId: z.string().uuid('Invalid node ID'),
});

export const getUserTagsSchema = z.object({
  search: z.string().max(100).optional(),
});

export const addNodeTagSchema = z.object({
  nodeId: z.string().uuid('Invalid node ID'),
  roomId: z.string().uuid('Invalid room ID'),
  tagName: z
    .string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name must be 50 characters or less'),
});

export const removeNodeTagSchema = z.object({
  nodeId: z.string().uuid('Invalid node ID'),
  tagId: z.string().uuid('Invalid tag ID'),
});

export type SearchNodesInput = z.infer<typeof searchNodesSchema>;
export type GetRoomNodesInput = z.infer<typeof getRoomNodesSchema>;
export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
export type UpdateNodePositionInput = z.infer<typeof updateNodePositionSchema>;
export type DeleteNodeInput = z.infer<typeof deleteNodeSchema>;
export type BatchUpdateNodePositionsInput = z.infer<typeof batchUpdateNodePositionsSchema>;
export type GetRoomEdgesInput = z.infer<typeof getRoomEdgesSchema>;
export type CreateEdgeInput = z.infer<typeof createEdgeSchema>;
export type DeleteEdgeInput = z.infer<typeof deleteEdgeSchema>;
export type GetNodeTagsInput = z.infer<typeof getNodeTagsSchema>;
export type GetUserTagsInput = z.infer<typeof getUserTagsSchema>;
export type AddNodeTagInput = z.infer<typeof addNodeTagSchema>;
export type RemoveNodeTagInput = z.infer<typeof removeNodeTagSchema>;
