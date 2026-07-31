import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { inspectSkill } from '../src/inspect.js';

const completeSkill = inputs => `# aggregation-skill

Use this skill when testing deterministic section aggregation behavior.

${inputs}

## Side Effects

The workflow reads local files only and never writes or uses the network without approval.

## Steps

1. Read the supplied repository path.
2. Produce a deterministic report for the maintainer.

## Verification

Run the tests with \`npm test\` and retain the result for repeatable review. These instructions include enough detail to exercise the substance check without changing the rubric weights or relying on unrelated keyword filler.
`;

async function inspectWithInputs(t, inputs) {
  const directory = await mkdtemp(join(tmpdir(), 'skillfit-aggregation-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, 'SKILL.md'), completeSkill(inputs));
  return inspectSkill(directory);
}

function assertStablePerfectReport(report) {
  assert.equal(report.score, 100);
  assert.equal(report.grade, 'ship');
  assert.deepEqual(
    report.results.map(({ id, weight }) => [id, weight]),
    [
      ['has-skill-md', 15],
      ['activation', 15],
      ['inputs', 12],
      ['side-effects', 14],
      ['examples', 12],
      ['verification', 14],
      ['portable', 8],
      ['length', 10]
    ]
  );
}

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

test('rejects long prose that only negates rubric keywords', async () => {
  const report = await inspectSkill('fixtures/negated-keywords-skill');
  assert.equal(report.grade, 'revise');
  assert.equal(report.score, 48);
  for (const id of ['inputs', 'side-effects', 'examples', 'verification']) {
    assert.equal(report.results.find(result => result.id === id).status, 'fail');
  }
});

test('accepts supported section aliases with concrete declarations', async () => {
  const report = await inspectSkill('fixtures/valid-variant-skill');
  assert.equal(report.grade, 'ship');
  assert.equal(report.score, 100);
});

test('aggregates repeated identical headings in document order', async t => {
  const report = await inspectWithInputs(t, `## Inputs

- repository path

## Inputs

- expected package name`);
  assertStablePerfectReport(report);
});

test('ignores a placeholder before a concrete supported alias', async t => {
  const report = await inspectWithInputs(t, `## Inputs

None.

## Required Tools

- Node.js 18 or newer`);
  assertStablePerfectReport(report);
});

test('ignores a placeholder after a concrete supported alias', async t => {
  const report = await inspectWithInputs(t, `## Requirements

- local repository path

## Tools

Not provided.`);
  assertStablePerfectReport(report);
});

test('does not aggregate placeholder and negated filler into evidence', async t => {
  const report = await inspectWithInputs(t, `## Inputs

None.

## Required Tools

Does not provide required tools.`);
  assert.equal(report.results.find(({ id }) => id === 'inputs').status, 'fail');
  assert.equal(report.score, 88);
});

test('aggregates multiple concrete aliases', async t => {
  const report = await inspectWithInputs(t, `## Required Inputs

- repository path

## Required Tools

- Node.js 18 or newer`);
  assertStablePerfectReport(report);
});
