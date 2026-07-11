# skillfit

Use this skill when evaluating whether an agent skill is ready to save, share, package, or run repeatedly.

## Inputs

- A local folder containing `SKILL.md`.
- Optional examples or fixtures referenced by that skill.

## Side Effects

The CLI reads local files and writes a report only when `--out` is provided. It does not install skills, approve proposals, call external services, or modify the inspected skill.

## Workflow

1. Run `skillfit ./path/to/skill --format markdown`.
2. Review failed checks first.
3. Fix activation, inputs, safety, examples, and verification gaps.
4. Re-run with `--format json` for automation.

## Verification

Run `npm test`, `npm run check`, `npm run build`, and `npm run smoke`.
