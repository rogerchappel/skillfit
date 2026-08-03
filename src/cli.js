import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { inspectSkill } from './inspect.js';
import { toJson, toMarkdown } from './report.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const usage = 'Usage: skillfit <skill-dir> [--format markdown|json] [--out file]';

class UsageError extends Error {
  constructor(message) {
    super(`${message}\n${usage}`);
    this.code = 'ERR_USAGE';
  }
}

function parseArguments(argv) {
  let target;
  let format = 'markdown';
  let out = null;
  const seen = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--format' || argument === '--out') {
      if (seen.has(argument)) throw new UsageError(`Duplicate option: ${argument}`);
      seen.add(argument);
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('-')) throw new UsageError(`Missing value for ${argument}`);
      index += 1;
      if (argument === '--format') format = value;
      else out = value;
    } else if (argument.startsWith('-')) {
      throw new UsageError(`Unknown option: ${argument}`);
    } else if (target === undefined) {
      target = argument;
    } else {
      throw new UsageError(`Unexpected operand: ${argument}`);
    }
  }

  if (!target) throw new UsageError('Missing skill directory');
  if (!['markdown', 'json'].includes(format)) throw new UsageError(`Unsupported format: ${format}`);
  return { target, format, out };
}

export async function run(argv) {
  if (argv.length === 1 && (argv[0] === '--version' || argv[0] === '-v')) {
    return { code: 0, output: `${pkg.version}\n` };
  }
  if (argv.length === 0 || (argv.length === 1 && (argv[0] === '--help' || argv[0] === '-h'))) {
    return { code: 0, output: `${usage}\n` };
  }
  const { target, format, out } = parseArguments(argv);
  const report = await inspectSkill(target);
  const output = format === 'json' ? toJson(report) : toMarkdown(report);
  if (out) {
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, output);
    return { code: report.grade === 'revise' ? 1 : 0, output: `${out}\n` };
  }
  return { code: report.grade === 'revise' ? 1 : 0, output };
}
