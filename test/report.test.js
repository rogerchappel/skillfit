import test from 'node:test';
import assert from 'node:assert/strict';
import { toJson, toMarkdown } from '../src/report.js';

const report = { skillDir: 'x', score: 85, grade: 'ship', results: [{ id: 'a', label: 'A', status: 'pass', weight: 10 }] };

test('renders json report', () => {
  assert.equal(JSON.parse(toJson(report)).grade, 'ship');
});

test('renders markdown report', () => {
  assert.match(toMarkdown(report), /skillfit report/);
  assert.match(toMarkdown(report), /\| pass \| a \|/);
});
