import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(60, 'Display name must be 60 characters or less')
    .trim(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').optional().or(z.literal('')),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
