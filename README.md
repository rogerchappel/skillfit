# skillfit

`skillfit` is a local-first CLI for checking whether an agent skill is ready to reuse. It reads a skill folder, scores practical readiness criteria, and emits Markdown or JSON reports for review or CI.

## Quickstart

```bash
npm install
npm test
npm run smoke
npm run release:check
node bin/skillfit.js fixtures/valid-skill --format markdown
node bin/skillfit.js fixtures/valid-skill --format json --out tmp/report.json
```

## What It Checks

- `SKILL.md` exists.
- Activation guidance is clear.
- Required inputs or tools are named.
- Side-effect boundaries and approval requirements are explicit.
- Examples or workflow steps are present.
- Verification commands are documented.
- Host-specific assumptions are limited.

## Release Verification

Run the full local gate before opening a release-facing pull request:

```bash
npm run release:check
```

The gate runs syntax checks, tests, the build step, fixture-backed CLI smoke, and package contents verification. CI runs the same command for pull requests and pushes to `main`.

## Safety Notes

`skillfit` reads local files and only writes a report when `--out` is provided. It does not install skills, approve proposals, call external services, or mutate the inspected directory.

## Limitations

The V1 rubric is intentionally deterministic and text based. It is best used as a release gate and review checklist, not as proof that a skill is semantically perfect.
