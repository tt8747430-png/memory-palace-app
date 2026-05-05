# migrations/

Drizzle-kit generates SQL migration files here when you run:

```bash
pnpm --filter @memory-palace/db generate
```

## Manual SQL — GIN FTS index

Drizzle cannot express a GIN index on a computed `tsvector` expression. The index below was applied manually to the Supabase production database and is **already live** — do not re-run it unless you drop and recreate the `nodes` table.

```sql
-- Full-text search index on nodes (already applied — reference only)
CREATE INDEX CONCURRENTLY idx_nodes_fts
ON nodes
USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));
```

If you need to apply it to a fresh local database after `supabase db reset`, run the SQL above via the Supabase SQL editor or `supabase db execute`.

## Connection strings

| Purpose                     | Variable             | Port  |
| --------------------------- | -------------------- | ----- |
| App runtime (serverless)    | `DATABASE_URL`       | 6543  |
| drizzle-kit generate/push   | `DIRECT_DATABASE_URL`| 5432  |

drizzle-kit uses `prepare` statements which are incompatible with PgBouncer/Supavisor in
transaction mode. Always point it at the direct connection.
