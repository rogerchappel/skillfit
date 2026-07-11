import { readdir, readFile } from 'node:fs/promises';

const required = ['README.md', 'SKILL.md', 'docs/PRD.md', 'docs/TASKS.md', 'docs/ORCHESTRATION.md'];
for (const file of required) {
  const text = await readFile(file, 'utf8');
  if (text.trim().length < 40) throw new Error(`${file} is too short`);
}
const entries = await readdir('fixtures');
if (entries.length < 2) throw new Error('expected at least two fixtures');
console.log('check ok');
