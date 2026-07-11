export const checks = [
  { id: 'has-skill-md', label: 'Includes SKILL.md', weight: 15, test: ctx => ctx.exists },
  { id: 'activation', label: 'Clear activation guidance', weight: 15, test: ctx => /use this skill|when to use|trigger/i.test(ctx.text) },
  { id: 'inputs', label: 'Required inputs or tools are named', weight: 12, test: ctx => /inputs?|required tools?|requires/i.test(ctx.text) },
  { id: 'side-effects', label: 'Side-effect boundaries are explicit', weight: 14, test: ctx => /side effects?|does not|approval|external/i.test(ctx.text) },
  { id: 'examples', label: 'Examples or workflow steps exist', weight: 12, test: ctx => /examples?|workflow|steps?/i.test(ctx.text) },
  { id: 'verification', label: 'Validation workflow is documented', weight: 14, test: ctx => /verification|validate|test|smoke/i.test(ctx.text) },
  { id: 'portable', label: 'Host-specific assumptions are limited', weight: 8, test: ctx => !/only works in|must use my private|secret/i.test(ctx.text) },
  { id: 'length', label: 'Instructions have useful substance', weight: 10, test: ctx => ctx.text.trim().split(/\s+/).length >= 80 }
];

export function grade(score) {
  if (score >= 85) return 'ship';
  if (score >= 65) return 'incubate';
  return 'revise';
}
