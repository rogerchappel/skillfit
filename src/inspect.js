import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { checks, grade } from './rubric.js';

export async function inspectSkill(skillDir) {
  let text = '';
  let exists = true;
  try {
    text = await readFile(join(skillDir, 'SKILL.md'), 'utf8');
  } catch (error) {
    exists = false;
  }

  const context = { exists, text };
  const results = checks.map(check => {
    const passed = Boolean(check.test(context));
    return { id: check.id, label: check.label, status: passed ? 'pass' : 'fail', weight: check.weight };
  });
  const score = results.filter(r => r.status === 'pass').reduce((sum, r) => sum + r.weight, 0);
  return { skillDir, score, grade: grade(score), results };
}
