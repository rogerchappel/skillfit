import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/skillfit.js', import.meta.url));
const validSkill = fileURLToPath(new URL('../fixtures/valid-skill', import.meta.url));
const incubateSkill = fileURLToPath(new URL('../fixtures/incubate-skill', import.meta.url));
const negatedSkill = fileURLToPath(new URL('../fixtures/negated-keywords-skill', import.meta.url));

function invoke(...args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
}

test('package entrypoint supports help and version', () => {
  const help = invoke('--help');
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /^Usage: skillfit /);

  const version = invoke('--version');
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /^\d+\.\d+\.\d+\n$/);
});

test('package entrypoint inspects a skill as Markdown and JSON', () => {
  const markdown = invoke(validSkill, '--format', 'markdown');
  assert.equal(markdown.status, 0, markdown.stderr);
  assert.match(markdown.stdout, /# skillfit report/);

  const json = invoke(validSkill, '--format', 'json');
  assert.equal(json.status, 0, json.stderr);
  assert.equal(JSON.parse(json.stdout).grade, 'ship');
});

test('package entrypoint writes an output file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'skillfit-cli-'));
  const output = join(directory, 'report.json');
  try {
    const result = invoke(validSkill, '--format', 'json', '--out', output);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, `${output}\n`);
    assert.equal(JSON.parse(await readFile(output, 'utf8')).grade, 'ship');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('package entrypoint rejects negated keyword filler', () => {
  const result = invoke(negatedSkill, '--format', 'json');
  assert.equal(result.status, 1, result.stderr);
  assert.equal(JSON.parse(result.stdout).grade, 'revise');
});

test('package entrypoint accepts supported headings with closing hashes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'skillfit-cli-closing-hashes-'));
  try {
    const source = await readFile(join(validSkill, 'SKILL.md'), 'utf8');
    const skill = source.replace(/^(#{2,6} (?:Inputs|Side Effects|Workflow|Verification))$/gm, '$1 ###');
    await writeFile(join(directory, 'SKILL.md'), skill.replaceAll('\n', '\r\n'));

    const result = invoke(directory, '--format', 'json');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).grade, 'ship');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('package entrypoint exits 1 for an incubate report', () => {
  const result = invoke(incubateSkill, '--format', 'json');
  assert.equal(result.status, 1, result.stderr);
  assert.equal(JSON.parse(result.stdout).grade, 'incubate');
});

test('package entrypoint exits 1 when writing an incubate report to --out', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'skillfit-incubate-'));
  const output = join(directory, 'report.json');
  try {
    const result = invoke(incubateSkill, '--format', 'json', '--out', output);
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.stdout, `${output}\n`);
    assert.equal(JSON.parse(await readFile(output, 'utf8')).grade, 'incubate');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

for (const [name, args, diagnostic] of [
  ['unknown options', [validSkill, '--bogus'], 'Unknown option: --bogus'],
  ['missing option values', [validSkill, '--out'], 'Missing value for --out'],
  ['duplicate options', [validSkill, '--format', 'json', '--format', 'markdown'], 'Duplicate option: --format'],
  ['extra operands', [validSkill, validSkill], `Unexpected operand: ${validSkill}`],
  ['invalid formats', [validSkill, '--format', 'yaml'], 'Unsupported format: yaml']
]) {
  test(`package entrypoint rejects ${name} with exit 2`, () => {
    const result = invoke(...args);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `${diagnostic}\nUsage: skillfit <skill-dir> [--format markdown|json] [--out file]\n`);
  });
}

test('package entrypoint distinguishes missing input from rubric failure', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'skillfit-empty-'));
  try {
    const missing = invoke(join(directory, 'does-not-exist'), '--format', 'json');
    assert.equal(missing.status, 2);
    assert.equal(missing.stdout, '');
    assert.match(missing.stderr, /directory does not exist/);

    const revise = invoke(directory, '--format', 'json');
    assert.equal(revise.status, 1, revise.stderr);
    assert.equal(JSON.parse(revise.stdout).grade, 'revise');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
