import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const emailSchema = credentialsSchema.pick({ email: true });
export const passwordSchema = credentialsSchema.pick({ password: true });

export type Credentials = z.infer<typeof credentialsSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
