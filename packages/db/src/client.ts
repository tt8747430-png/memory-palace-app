import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

type DrizzleClient = ReturnType<typeof drizzle>;
let cached: DrizzleClient | null = null;

// Lazy-init: importing this module never reads DATABASE_URL.
// Each runtime caller (Server Action, Route Handler) gets the same instance.
export function getDb(): DrizzleClient {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Use the Supavisor pooled connection string (port 6543).',
    );
  }
  cached = drizzle(postgres(url));
  return cached;
}

// Proxy preserves `db.select(...)` style usage at call sites without resolving
// the underlying connection until the first method is touched.
export const db = new Proxy({} as DrizzleClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
