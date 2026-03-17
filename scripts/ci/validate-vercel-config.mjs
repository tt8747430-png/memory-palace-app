import { readFileSync } from 'node:fs';

const filePath = 'vercel.json';

let parsed;
try {
  parsed = JSON.parse(readFileSync(filePath, 'utf8'));
} catch (error) {
  console.error('Vercel config check failed: vercel.json is not valid JSON.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
  console.error('Vercel config check failed: vercel.json must contain a single JSON object.');
  process.exit(1);
}

const requiredStringKeys = ['buildCommand', 'installCommand', 'ignoreCommand'];
for (const key of requiredStringKeys) {
  if (typeof parsed[key] !== 'string' || parsed[key].trim().length === 0) {
    console.error(`Vercel config check failed: "${key}" must be a non-empty string.`);
    process.exit(1);
  }
}

if (!parsed.buildCommand.includes('@memory-palace/web')) {
  console.error(
    'Vercel config check failed: buildCommand must target @memory-palace/web in this monorepo.',
  );
  process.exit(1);
}

console.log('Vercel config check passed.');
