export { getDb } from './client';
export * from './schema';
export * from './relations';
export * from './types';
// Re-export drizzle-orm query helpers so all workspace packages share
// one virtual-store resolution and avoid structural-type mismatches.
export {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  not,
  notInArray,
  or,
  sql,
  getTableColumns,
} from 'drizzle-orm';
export type { SQL } from 'drizzle-orm';
