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

The gate runs syntax checks, tests, the build step, fixture-backed CLI smoke, and package contents verification. CI runs the same command on Node 18.18.2 (the supported Node 18 baseline) and Node 20 for pull requests and pushes to `main`.

## Safety Notes

`skillfit` reads local files and only writes a report when `--out` is provided. It does not install skills, approve proposals, call external services, or mutate the inspected directory.

## Limitations

The V1 rubric is intentionally deterministic and text based. Inputs, side effects,
examples/workflow, and verification must appear under level 2–6 Markdown headings.
Supported heading names are:

- Inputs: `Inputs`, `Requirements`, `Required Inputs`, `Required Tools`, or `Tools`.
- Boundaries: `Side Effects`, `Safety`, `Permissions`, or `Approval Boundaries`.
- Procedure: `Examples`, `Workflow`, `Steps`, or `Usage`.
- Checks: `Verification`, `Validation`, `Testing`, or `Tests`.

These sections must contain concrete evidence: a declared input/tool, an explicit
operation boundary, a list or fenced example/workflow, and a command or imperative
validation instruction, respectively. A heading by itself, placeholder such as
“not provided,” or keywords embedded in unrelated prose do not pass.
When a category uses repeated headings or more than one supported alias, the rubric
combines its substantive sections in document order. Placeholder-only sections are
ignored, so they neither override concrete evidence nor create a passing result.

The rubric does not interpret whether instructions are correct or safe in context.
Use it as a release gate and review checklist, not as proof that a skill is
semantically perfect.
