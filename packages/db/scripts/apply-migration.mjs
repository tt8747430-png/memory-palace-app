import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '../../apps/web/.env.local'), override: false });

const file = process.argv[2];
if (!file) {
  console.error('Usage: tsx scripts/apply-migration.mjs <migration-file>');
  process.exit(1);
}

const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error('DIRECT_DATABASE_URL or DATABASE_URL must be set.');
  process.exit(1);
}

const sql = postgres(url, { ssl: 'require', max: 1, prepare: false });
const sqlText = await readFile(resolve(process.cwd(), file), 'utf8');

console.log(`Applying ${file} …`);
try {
  await sql.unsafe(sqlText);
  console.log('OK');
} catch (err) {
  console.error('FAILED:', err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
