# valid-variant-skill

Use this skill when a maintainer needs to review a package without changing it.

## Requirements

- Provide the package directory.
- Provide the expected package name.

## Permissions

The workflow reads files only. It must never write changes or access the network without approval.

## Steps

1. Read the package manifest.
2. Compare its name with the expected name.
3. Report any mismatch.

## Validation

Execute the check with `node scripts/check.js`.

The result should exit successfully and print the expected package name. Keep the report with the review so another maintainer can repeat the same validation independently.
