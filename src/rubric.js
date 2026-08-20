const sectionAliases = {
  inputs: ['inputs', 'requirements', 'required inputs', 'required tools', 'tools'],
  sideEffects: ['side effects', 'safety', 'permissions', 'approval boundaries'],
  examples: ['examples', 'workflow', 'steps', 'usage'],
  verification: ['verification', 'validation', 'testing', 'tests']
};

function linesOutsideFences(text) {
  const lines = [];
  let fence;

  for (const line of text.matchAll(/^.*$/gm)) {
    const value = line[0].replace(/\r$/, '');

    if (fence) {
      const closing = value.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      if (closing && closing[1][0] === fence.marker && closing[1].length >= fence.length) {
        fence = undefined;
      }
      continue;
    }

    const opening = value.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (opening && (opening[1][0] === '~' || !opening[2].includes('`'))) {
      fence = { marker: opening[1][0], length: opening[1].length };
      continue;
    }

    lines.push({ index: line.index, value });
  }

  return lines;
}

function sections(text) {
  const result = [];
  const matches = [];

  for (const { index, value } of linesOutsideFences(text)) {
    const heading = value.match(/^(#{2,6})[ \t]+(.+?)(?:[ \t]+#+[ \t]*)?$/);
    if (heading) matches.push({ index, raw: value, level: heading[1].length, heading: heading[2] });
  }

  for (let index = 0; index < matches.length; index += 1) {
    const heading = matches[index].heading.trim().toLowerCase();
    const start = matches[index].index + matches[index].raw.length;
    const boundary = matches.slice(index + 1).find(candidate => candidate.level <= matches[index].level);
    const end = boundary?.index ?? text.length;
    result.push({ heading, content: text.slice(start, end).trim() });
  }
  return result;
}

function hasActivationGuidance(ctx) {
  const activation = /\b(?:use this skill|when to use|triggers?)\b/gi;
  const negation = /\b(?:do not|don't|never|must not|should not|cannot|can't|not to)\b[^.!?;]{0,80}$/i;

  return linesOutsideFences(ctx.text).some(({ value }) => {
    activation.lastIndex = 0;
    for (const match of value.matchAll(activation)) {
      const clausePrefix = value.slice(0, match.index);
      if (!negation.test(clausePrefix)) return true;
    }
    return false;
  });
}

function section(ctx, names) {
  const parsed = ctx.sections ??= sections(ctx.text);
  const supported = new Set(names);
  return parsed
    .filter(({ heading, content }) => supported.has(heading) && !isPlaceholder(content))
    .map(({ content }) => content)
    .join('\n');
}

function hasSubstance(value) {
  return value.replace(/[`*_>#-]/g, ' ').trim().split(/\s+/).length >= 3;
}

function isPlaceholder(value) {
  return /^(?:n\/?a|none|nothing|not (?:provided|documented|required)|no .+|does not (?:provide|document|name|include).*)[.!]?$/i
    .test(value.replace(/^[-*]\s+/, '').trim());
}

function hasDeclaredInputs(ctx) {
  const value = section(ctx, sectionAliases.inputs);
  if (!hasSubstance(value) || isPlaceholder(value)) return false;
  return true;
}

function hasSideEffectBoundary(ctx) {
  const value = section(ctx, sectionAliases.sideEffects);
  if (!hasSubstance(value) || isPlaceholder(value)) return false;
  return /\b(?:read(?:s|-only)?|write(?:s)?|create(?:s)?|update(?:s)?|delete(?:s)?|modify|mutate|external|network|approval|permission|dry[- ]run)\b/i.test(value)
    && /\b(?:only|never|without|before|requires?|must|may|does not|will not)\b/i.test(value);
}

function hasExamplesOrWorkflow(ctx) {
  const value = section(ctx, sectionAliases.examples);
  if (!hasSubstance(value) || isPlaceholder(value)) return false;
  return /(?:^|\n)\s*(?:[-*+]|\d+[.)])\s+\S/m.test(value)
    || /(?:^|\n)\s*```[\s\S]+?```/m.test(value);
}

function hasVerification(ctx) {
  const value = section(ctx, sectionAliases.verification);
  if (!hasSubstance(value) || isPlaceholder(value)) return false;
  return /`[^`\n]+`|```[\s\S]+?```/.test(value)
    || /\b(?:run|execute)\s+(?:the\s+)?(?:tests?|checks?|validation|linter|build|smoke)\b/i.test(value);
}

export const checks = [
  { id: 'has-skill-md', label: 'Includes SKILL.md', weight: 15, test: ctx => ctx.exists },
  { id: 'activation', label: 'Clear activation guidance', weight: 15, test: hasActivationGuidance },
  { id: 'inputs', label: 'Required inputs or tools are named', weight: 12, test: hasDeclaredInputs },
  { id: 'side-effects', label: 'Side-effect boundaries are explicit', weight: 14, test: hasSideEffectBoundary },
  { id: 'examples', label: 'Examples or workflow steps exist', weight: 12, test: hasExamplesOrWorkflow },
  { id: 'verification', label: 'Validation workflow is documented', weight: 14, test: hasVerification },
  { id: 'portable', label: 'Host-specific assumptions are limited', weight: 8, test: ctx => !/only works in|must use my private|secret/i.test(ctx.text) },
  { id: 'length', label: 'Instructions have useful substance', weight: 10, test: ctx => ctx.text.trim().split(/\s+/).length >= 80 }
];

export function grade(score) {
  if (score >= 85) return 'ship';
  if (score >= 65) return 'incubate';
  return 'revise';
}
