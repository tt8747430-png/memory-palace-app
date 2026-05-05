import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./src/schema.ts', './src/relations.ts'],
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // drizzle-kit requires a direct Postgres connection (not Supavisor pooler).
    // Set DIRECT_DATABASE_URL=postgresql://postgres:<pw>@db.<ref>.supabase.com:5432/postgres
    // Fall back to DATABASE_URL for CI environments where only one URL is set.
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!,
  },
});
