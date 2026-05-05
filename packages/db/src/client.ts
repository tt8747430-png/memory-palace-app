import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as relationsSchema from './relations';
import * as tableSchema from './schema';

const fullSchema = { ...tableSchema, ...relationsSchema };

type DbClient = ReturnType<typeof drizzle<typeof fullSchema>>;

let client: DbClient | null = null;

export function getDb(): DbClient {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Use the Supavisor pooled connection string (port 6543).',
    );
  }
  client = drizzle(postgres(url), { schema: fullSchema });
  return client;
}
