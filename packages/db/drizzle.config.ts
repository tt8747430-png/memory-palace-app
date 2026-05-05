import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit does not load .env.local automatically — do it explicitly.
config({ path: '../../apps/web/.env.local', override: false });

export default defineConfig({
  schema: ['./src/schema.ts', './src/relations.ts'],
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // drizzle-kit requires a direct Postgres connection (not Supavisor pooler).
    // Set DIRECT_DATABASE_URL=postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres
    // Fall back to DATABASE_URL for CI environments where only one URL is set.
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!,
    ssl: 'require',
  },
});
