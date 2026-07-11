import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { inspectSkill } from './inspect.js';
import { toJson, toMarkdown } from './report.js';

export async function run(argv) {
  const args = [...argv];
  const target = args.shift();
  if (!target || target === '--help' || target === '-h') {
    return { code: 0, output: 'Usage: skillfit <skill-dir> [--format markdown|json] [--out file]\n' };
  }
  const formatIndex = args.indexOf('--format');
  const format = formatIndex >= 0 ? args[formatIndex + 1] : 'markdown';
  const outIndex = args.indexOf('--out');
  const out = outIndex >= 0 ? args[outIndex + 1] : null;
  if (!['markdown', 'json'].includes(format)) throw new Error(`Unsupported format: ${format}`);
  const report = await inspectSkill(target);
  const output = format === 'json' ? toJson(report) : toMarkdown(report);
  if (out) {
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, output);
    return { code: report.grade === 'revise' ? 1 : 0, output: `${out}\n` };
  }
  return { code: report.grade === 'revise' ? 1 : 0, output };
}
