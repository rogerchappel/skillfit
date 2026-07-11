import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectSkill } from '../src/inspect.js';

test('scores a complete skill as ship ready', async () => {
  const report = await inspectSkill('fixtures/valid-skill');
  assert.equal(report.grade, 'ship');
  assert.equal(report.score, 100);
});

test('flags a thin skill for revision', async () => {
  const report = await inspectSkill('fixtures/problem-skill');
  assert.equal(report.grade, 'revise');
  assert.ok(report.results.some(result => result.status === 'fail'));
});
