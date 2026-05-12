import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '../../apps/web/.env.local', override: false });

export default defineConfig({
  schema: ['./src/schema.ts', './src/relations.ts'],
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!,
    ssl: 'require',
  },
});
