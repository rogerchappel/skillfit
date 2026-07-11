#!/usr/bin/env node
import { run } from '../src/cli.js';

try {
  const result = await run(process.argv.slice(2));
  process.stdout.write(result.output);
  process.exitCode = result.code;
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 2;
}
