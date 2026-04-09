# No GitHub Actions CI Policy

## Status

GitHub Actions CI (`.github/workflows/`) is **intentionally absent** from this repository.

## Rationale

This project is developed and hosted on Replit. The Replit→GitHub sync mechanism does not
include the `workflow` permission scope required to push files under `.github/workflows/`.
Attempts to add a workflow file result in a push error:

```
refusing to allow a GitHub App to create or update workflow
`.github/workflows/ci.yml` without `workflows` permission
```

Rather than leaving a workflow file in an inconsistent state (present locally, unable to
be pushed), the decision was made to keep the repository free of any GitHub Actions files
and to rely on the local verification commands below instead.

## Known Limitation

If the repository is later migrated to a standard Git host or the Replit integration is
granted the `workflow` permission, CI can be re-added. The lockfile already includes
win32-x64 native binaries so a matrix build across `ubuntu-latest` and `windows-latest`
would work out of the box.

## Expected Local Verification Before Push

Run these commands locally to replicate what CI would check:

```sh
# 1. Verify documentation is consistent with the no-CI policy
pnpm run verify

# 2. Full typecheck across all packages
pnpm run typecheck

# 3. Build all packages (mockup-sandbox skipped)
pnpm run build

# 4. API integration and unit tests
pnpm --filter @workspace/api-server run test
```

All four commands must pass before pushing to main.

## `scripts/verify-repo-consistency.mjs`

The verify script (`pnpm run verify`) enforces this policy programmatically:

- **PASS** — `.github/workflows/ci.yml` is absent (expected state).
- **FAIL** — `replit.md` or `STATUS.md` contains a positive claim that CI is present
  while the workflow file is absent (documentation contradiction).
- **FAIL** — The workflow file exists while documentation says CI is absent (opposite
  contradiction).

This catches accidental additions of a workflow file or documentation drift without
requiring actual CI infrastructure.

## Platform Support Notes

The `pnpm-lock.yaml` contains native binaries for both Linux x64 and Windows x64:

| Package | Linux x64 | Windows x64 |
|---|---|---|
| `@esbuild` | `linux-x64` | `win32-x64` |
| `@rollup/rollup-*` | `linux-x64-gnu` | `win32-x64-gnu`, `win32-x64-msvc` |
| `lightningcss-*` | `linux-x64-gnu` | `win32-x64-msvc` |
| `@tailwindcss/oxide-*` | `linux-x64-gnu` | `win32-x64-msvc` |

macOS and Linux non-x64 binaries are excluded from the lockfile to reduce install size.
