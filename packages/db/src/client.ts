import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

type DrizzleClient = ReturnType<typeof drizzle>;

let client: DrizzleClient | null = null;

export function getDb(): DrizzleClient {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Use the Supavisor pooled connection string (port 6543).',
    );
  }
  client = drizzle(postgres(url));
  return client;
}
