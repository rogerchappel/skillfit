import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
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

test('treats an existing directory without SKILL.md as a revise report', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'skillfit-missing-file-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const report = await inspectSkill(directory);
  assert.equal(report.grade, 'revise');
  assert.equal(report.results.find(({ id }) => id === 'has-skill-md').status, 'fail');
});

test('rejects a missing input directory', async () => {
  await assert.rejects(() => inspectSkill(join(tmpdir(), 'skillfit-does-not-exist')), error => {
    assert.equal(error.code, 'ERR_INPUT');
    assert.match(error.message, /^Cannot inspect .*: directory does not exist$/);
    return true;
  });
});

test('rejects an input path that is not a directory', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'skillfit-file-input-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = join(directory, 'input.md');
  await writeFile(file, '# not a directory');
  await assert.rejects(() => inspectSkill(file), error => {
    assert.equal(error.code, 'ERR_INPUT');
    assert.match(error.message, /: not a directory$/);
    return true;
  });
});

test('rejects an unreadable SKILL.md input', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'skillfit-unreadable-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, 'SKILL.md'));
  await assert.rejects(() => inspectSkill(directory), error => {
    assert.equal(error.code, 'ERR_INPUT');
    assert.match(error.message, /Cannot read .*SKILL\.md/);
    return true;
  });
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

test('does not treat headings inside fenced samples as rubric sections', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'skillfit-fenced-sample-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, 'SKILL.md'), `# sample-authoring-skill

Use this skill when writing long illustrative samples for documentation. The surrounding
instructions deliberately provide enough explanatory prose to satisfy the length check,
but they do not make any concrete input, safety, workflow, or verification declarations.
The sample below is reference material only and must not manufacture release readiness.

~~~markdown
## Inputs

- local repository path

## Safety

The workflow reads local files only and never writes without approval.

## Steps

1. Read the repository.
2. Produce the report.

## Verification

Run the tests with \`npm test\` and retain the output for review.
~~~

Additional prose keeps this document realistic and substantial while making clear that
all apparent rubric evidence exists only in the fenced Markdown sample above.
`);

  const report = await inspectSkill(directory);
  assert.equal(report.score, 48);
  assert.equal(report.grade, 'revise');
  for (const id of ['inputs', 'side-effects', 'examples', 'verification']) {
    assert.equal(report.results.find(result => result.id === id).status, 'fail');
  }
});

test('retains fenced command examples inside real rubric sections', async t => {
  const report = await inspectWithInputs(t, `## Inputs

- local repository path

## Workflow

\`\`\`sh
npm install
npm run build
\`\`\`

## Validation

~~~sh
npm test
~~~`);

  assertStablePerfectReport(report);
});
