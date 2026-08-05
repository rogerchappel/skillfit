import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

test('prints help for CLI smoke checks', async () => {
  const result = await run(['--help']);
  assert.equal(result.code, 0);
  assert.match(result.output, /^Usage: skillfit/);
});

for (const [name, argv, message] of [
  ['unknown options', ['fixtures/valid-skill', '--bogus'], 'Unknown option: --bogus'],
  ['missing format values', ['fixtures/valid-skill', '--format'], 'Missing value for --format'],
  ['missing output values', ['fixtures/valid-skill', '--out'], 'Missing value for --out'],
  ['duplicate formats', ['fixtures/valid-skill', '--format', 'json', '--format', 'markdown'], 'Duplicate option: --format'],
  ['duplicate outputs', ['fixtures/valid-skill', '--out', 'a', '--out', 'b'], 'Duplicate option: --out'],
  ['extra operands', ['fixtures/valid-skill', 'fixtures/problem-skill'], 'Unexpected operand: fixtures/problem-skill'],
  ['unsupported formats', ['fixtures/valid-skill', '--format', 'yaml'], 'Unsupported format: yaml']
]) {
  test(`rejects ${name} with a usage error`, async () => {
    await assert.rejects(() => run(argv), error => {
      assert.equal(error.code, 'ERR_USAGE');
      assert.equal(error.message, `${message}\nUsage: skillfit <skill-dir> [--format markdown|json] [--out file]`);
      return true;
    });
  });
}

test('supports markdown and json reports', async () => {
  const markdown = await run(['fixtures/valid-skill']);
  const json = await run(['fixtures/valid-skill', '--format', 'json']);
  assert.equal(markdown.code, 0);
  assert.match(markdown.output, /^# skillfit report/);
  assert.equal(JSON.parse(json.output).grade, 'ship');
});

test('writes reports to --out', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'skillfit-cli-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const outputPath = join(directory, 'reports', 'result.json');
  const result = await run(['fixtures/valid-skill', '--format', 'json', '--out', outputPath]);
  assert.equal(result.code, 0);
  assert.equal(result.output, `${outputPath}\n`);
  assert.equal(JSON.parse(await readFile(outputPath, 'utf8')).grade, 'ship');
});

test('returns exit 1 for an incubate report', async () => {
  const result = await run(['fixtures/incubate-skill', '--format', 'json']);
  assert.equal(result.code, 1);
  assert.equal(JSON.parse(result.output).grade, 'incubate');
});

test('returns exit 1 when writing an incubate report to --out', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'skillfit-incubate-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const outputPath = join(directory, 'report.json');
  const result = await run(['fixtures/incubate-skill', '--format', 'json', '--out', outputPath]);
  assert.equal(result.code, 1);
  assert.equal(result.output, `${outputPath}\n`);
  assert.equal(JSON.parse(await readFile(outputPath, 'utf8')).grade, 'incubate');
});
