import { z } from 'zod';

const TITLE_MAX = 100;

export const createRoomSchema = z.object({
  palaceId: z.uuid({ error: 'Invalid palace ID' }),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(TITLE_MAX, `Title must be ${TITLE_MAX} characters or less`),
  position: z.number().int().min(0).optional().default(0),
});

export const updateRoomSchema = z.object({
  id: z.uuid({ error: 'Invalid room ID' }),
  palaceId: z.uuid({ error: 'Invalid palace ID' }),
  title: z.string().min(1, 'Title cannot be empty').max(TITLE_MAX).optional(),
  position: z.number().int().min(0).optional(),
});

export const roomIdSchema = z.object({
  id: z.uuid({ error: 'Invalid room ID' }),
  palaceId: z.uuid({ error: 'Invalid palace ID' }),
});

export const getRoomsSchema = z.object({
  palaceId: z.uuid({ error: 'Invalid palace ID' }),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type RoomIdInput = z.infer<typeof roomIdSchema>;
export type GetRoomsInput = z.infer<typeof getRoomsSchema>;
