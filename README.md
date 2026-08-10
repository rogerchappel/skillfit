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

## Command-line usage

```text
Usage: skillfit <skill-dir> [--format markdown|json] [--out file]
```

Pass exactly one skill directory. `--format` and `--out` may each be used once
and require a value. Unknown options, duplicate options, extra operands, missing
values, and unsupported formats print a concise usage diagnostic and exit 2.

Exit 0 means the skill earned a `ship` grade. Exit 1 means an existing skill
directory was inspected and earned either `incubate` or `revise`, including when
that directory has no `SKILL.md`. A missing or unreadable input is an operational
error and exits 2; it is not emitted as a rubric report. These exit codes are the
same whether the report is printed to stdout or written with `--out`.

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
Valid CommonMark closing hash sequences are accepted when whitespace separates them
from the heading text (for example, `## Inputs ###`).
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
Headings and activation phrases shown inside backtick or tilde fenced code samples are
ignored, including everything after an unclosed fence. Real activation guidance before
or after a closed fence still counts. Fenced commands inside a real supported section
still count as that section's evidence.

The rubric does not interpret whether instructions are correct or safe in context.
Use it as a release gate and review checklist, not as proof that a skill is
semantically perfect.
