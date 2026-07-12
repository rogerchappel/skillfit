#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const [pack] = JSON.parse(result.stdout);
const packedFiles = new Set(pack.files.map((file) => file.path));
const requiredFiles = [
  'bin/skillfit.js',
  'src/cli.js',
  'src/inspect.js',
  'fixtures/valid-skill/SKILL.md',
  'docs/RELEASE_CANDIDATE.md',
  'SKILL.md',
  'README.md',
  'LICENSE',
  'package.json',
];
const forbiddenFiles = [
  'tmp/smoke.md',
  'test/inspect.test.js',
  'test/report.test.js',
];

const missing = requiredFiles.filter((file) => !packedFiles.has(file));
const forbidden = forbiddenFiles.filter((file) => packedFiles.has(file));
if (missing.length > 0 || forbidden.length > 0) {
  if (missing.length > 0) console.error(`Package smoke failed; missing: ${missing.join(', ')}`);
  if (forbidden.length > 0) console.error(`Package smoke failed; unexpectedly packed: ${forbidden.join(', ')}`);
  process.exit(1);
}

console.log(`Package smoke passed with ${pack.files.length} files.`);
