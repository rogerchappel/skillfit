import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../src/cli.js';
import pkg from '../package.json' with { type: 'json' };
import { toJson, toMarkdown } from '../src/report.js';

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
