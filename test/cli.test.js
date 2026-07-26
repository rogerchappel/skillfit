import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/skillfit.js', import.meta.url));
const validSkill = fileURLToPath(new URL('../fixtures/valid-skill', import.meta.url));

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
