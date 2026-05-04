import { z } from 'zod';

// Accepts either the new publishable key (sb_publishable_...) or the legacy
// anon JWT, with a deprecation warning for the latter. Both are RLS-gated and
// safe to ship to the browser; the publishable key is the modern issue under
// Supabase's 2025 key system (rotatable, scoped, separate from secret keys).
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const publishable =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (
  !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  console.warn(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY is deprecated. Rename to NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and use the new sb_publishable_* key from Supabase.',
  );
}

const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
