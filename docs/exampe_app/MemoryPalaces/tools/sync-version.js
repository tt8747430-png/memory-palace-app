#!/usr/bin/env node
/**
 * sync-version.js — keeps APP_VERSION in sw.js and src/js/modules/version.js
 * in sync with the canonical version in package.json.
 *
 * Run automatically via "predev" and "prebuild" npm scripts.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version;

// --- Update sw.js ---
const swPath = join(root, 'sw.js');
let sw = readFileSync(swPath, 'utf8');
const swUpdated = sw.replace(/^(const APP_VERSION\s*=\s*')[^']+(';\s*)$/m, `$1${version}$2`);
if (sw !== swUpdated) {
  writeFileSync(swPath, swUpdated, 'utf8');
  console.log(`[sync-version] sw.js → ${version}`);
} else {
  console.log(`[sync-version] sw.js already at ${version}`);
}

// --- Update version.js ---
const versionPath = join(root, 'src/js/modules/version.js');
let vjs = readFileSync(versionPath, 'utf8');
const vjsUpdated = vjs.replace(
  /^(export const APP_VERSION\s*=\s*')[^']+(';\s*)$/m,
  `$1${version}$2`,
);
if (vjs !== vjsUpdated) {
  writeFileSync(versionPath, vjsUpdated, 'utf8');
  console.log(`[sync-version] version.js → ${version}`);
} else {
  console.log(`[sync-version] version.js already at ${version}`);
}
