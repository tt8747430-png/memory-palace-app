import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// ✅ CORRECT: pooled connection via Supavisor (port 6543)
// See ARCHITECTURE.md §5.A — never use direct connection in serverless
const sql = postgres(process.env.DATABASE_URL!);

export const db = drizzle(sql);
