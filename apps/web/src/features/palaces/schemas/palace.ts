import { z } from 'zod';

const TITLE_MAX = 100;
const DESC_MAX = 500;

export const createPalaceSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(TITLE_MAX, `Title must be ${TITLE_MAX} characters or less`),
  description: z
    .string()
    .max(DESC_MAX, `Description must be ${DESC_MAX} characters or less`)
    .optional(),
});

export const updatePalaceSchema = z.object({
  id: z.string().uuid('Invalid palace ID'),
  title: z.string().min(1, 'Title cannot be empty').max(TITLE_MAX).optional(),
  description: z.string().max(DESC_MAX).nullable().optional(),
});

export const palaceIdSchema = z.object({ id: z.string().uuid('Invalid palace ID') });

export type CreatePalaceInput = z.infer<typeof createPalaceSchema>;
export type UpdatePalaceInput = z.infer<typeof updatePalaceSchema>;
export type PalaceIdInput = z.infer<typeof palaceIdSchema>;
