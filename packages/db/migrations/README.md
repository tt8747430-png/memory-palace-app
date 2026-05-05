# migrations/

Drizzle-kit generates SQL migration files here when you run:

```bash
pnpm --filter @memory-palace/db generate
```

## Manual SQL — apply after initial migration

Drizzle cannot express a GIN index on a computed `tsvector` expression. Apply this SQL
manually after the generated migration runs (e.g., via Supabase SQL editor or a custom
migration script):

```sql
-- Full-text search index on nodes
CREATE INDEX CONCURRENTLY idx_nodes_fts
ON nodes
USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));
```

`CONCURRENTLY` avoids locking the table during index creation. Safe for both initial
builds and future re-indexes.

## Connection strings

| Purpose                     | Variable             | Port  |
| --------------------------- | -------------------- | ----- |
| App runtime (serverless)    | `DATABASE_URL`       | 6543  |
| drizzle-kit generate/push   | `DIRECT_DATABASE_URL`| 5432  |

drizzle-kit uses `prepare` statements which are incompatible with PgBouncer/Supavisor in
transaction mode. Always point it at the direct connection.
