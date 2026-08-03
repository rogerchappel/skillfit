import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { checks, grade } from './rubric.js';

export async function inspectSkill(skillDir) {
  let input;
  try {
    input = await stat(skillDir);
  } catch (error) {
    const detail = error.code === 'ENOENT' ? 'directory does not exist' : error.message;
    const inputError = new Error(`Cannot inspect ${skillDir}: ${detail}`);
    inputError.code = 'ERR_INPUT';
    throw inputError;
  }
  if (!input.isDirectory()) {
    const error = new Error(`Cannot inspect ${skillDir}: not a directory`);
    error.code = 'ERR_INPUT';
    throw error;
  }

  let text = '';
  let exists = true;
  try {
    text = await readFile(join(skillDir, 'SKILL.md'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      exists = false;
    } else {
      const inputError = new Error(`Cannot read ${join(skillDir, 'SKILL.md')}: ${error.message}`);
      inputError.code = 'ERR_INPUT';
      throw inputError;
    }
  }

  const context = { exists, text };
  const results = checks.map(check => {
    const passed = Boolean(check.test(context));
    return { id: check.id, label: check.label, status: passed ? 'pass' : 'fail', weight: check.weight };
  });
  const score = results.filter(r => r.status === 'pass').reduce((sum, r) => sum + r.weight, 0);
  return { skillDir, score, grade: grade(score), results };
}
