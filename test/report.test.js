import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { run } from '../src/cli.js';
import { toJson, toMarkdown } from '../src/report.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const report = { skillDir: 'x', score: 85, grade: 'ship', results: [{ id: 'a', label: 'A', status: 'pass', weight: 10 }] };

test('renders json report', () => {
  assert.equal(JSON.parse(toJson(report)).grade, 'ship');
});

test('renders markdown report', () => {
  assert.match(toMarkdown(report), /skillfit report/);
  assert.match(toMarkdown(report), /\| pass \| a \|/);
});

test('prints package version for CLI smoke checks', async () => {
  const result = await run(['--version']);
  assert.equal(result.code, 0);
  assert.equal(result.output.trim(), pkg.version);
});
