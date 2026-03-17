import { existsSync } from 'node:fs';

const proxyPath = 'apps/web/src/proxy.ts';
const middlewarePath = 'apps/web/src/middleware.ts';

const hasProxy = existsSync(proxyPath);
const hasMiddleware = existsSync(middlewarePath);

if (!hasProxy) {
  console.error(`Guardrail failed: Missing ${proxyPath}.`);
  process.exit(1);
}

if (hasMiddleware) {
  console.error(
    `Guardrail failed: ${middlewarePath} exists alongside ${proxyPath}. Use proxy.ts only for Next.js 16.`,
  );
  process.exit(1);
}

console.log('Guardrails check passed: proxy entrypoint is valid.');
