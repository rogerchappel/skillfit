# PRD: skillfit

Status: in-progress
Decision: build now

## Pitch

A local-first readiness checker that tells an agent builder whether a reusable skill is specific, safe, testable, and portable enough to ship.

## V1 Scope

- Read a skill directory containing `SKILL.md`.
- Score activation, inputs, side-effect boundaries, examples, and validation workflow.
- Emit Markdown and JSON reports.
- Support fixture-backed tests and a smoke command.

## Out of Scope

- Installing skills into hosts.
- Calling external APIs.
- Enforcing a single proprietary skill format.
