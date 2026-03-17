---
phase: 05-packaging-and-maintenance
plan: "02"
subsystem: infra
tags: [github-actions, npm, publish, smoke-test, contributing]

requires:
  - phase: 05-packaging-and-maintenance plan 01
    provides: dependabot.yml, automerge workflow, Node version guard, prepublishOnly script
provides:
  - Tag-triggered npm publish workflow with cross-platform smoke-test gate
  - CONTRIBUTING.md with NPM_TOKEN setup instructions for maintainers
affects: [future maintainers, npm release process]

tech-stack:
  added: []
  patterns:
    - "Smoke-test matrix gates publish job via needs: dependency"
    - "cache-dependency-path explicit on setup-node to bypass working-directory limitation"
    - "Windows CI uses shell: bash with RUNNER_TEMP for portable temp paths"

key-files:
  created:
    - .github/workflows/publish.yml
    - CONTRIBUTING.md
  modified: []

key-decisions:
  - "publish.yml is a separate file from ci.yml — same separation pattern as version-check.yml"
  - "fail-fast: false on smoke-test matrix so all OS results are visible even if one fails"
  - "NPM_TOKEN documented in CONTRIBUTING.md as granular access token (locked decision from CONTEXT.md)"
  - "OIDC upgrade path documented in both publish.yml comments and CONTRIBUTING.md"

patterns-established:
  - "Smoke-test-before-publish: pack tarball locally, run npx --yes <tarball> --yes, verify output file"
  - "Windows CI pattern: shell: bash + RUNNER_TEMP instead of /tmp"

requirements-completed: [SEC-01]

duration: 5min
completed: 2026-03-17
---

# Phase 5 Plan 02: Packaging and Maintenance Summary

**Tag-triggered npm publish workflow with 3-OS smoke-test matrix gate and CONTRIBUTING.md NPM_TOKEN setup guide**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-17T00:00:00Z
- **Completed:** 2026-03-17T00:05:00Z
- **Tasks:** 2 (checkpoint pending human review)
- **Files modified:** 2

## Accomplishments

- Created `.github/workflows/publish.yml` with smoke-test matrix (ubuntu, macos, windows) and gated publish job
- Created `CONTRIBUTING.md` with step-by-step NPM_TOKEN granular token setup
- All cross-platform pitfalls addressed: TTY-free `--yes` flag, Windows `shell: bash` + `RUNNER_TEMP`, explicit `cache-dependency-path` on both setup-node steps

## Task Commits

1. **Task 1: Create publish.yml** - `32354cd` (feat)
2. **Task 2: Create CONTRIBUTING.md** - `76bf394` (feat)

## Files Created/Modified

- `.github/workflows/publish.yml` - Two-job workflow: smoke-test matrix across 3 OS + gated publish to npm
- `CONTRIBUTING.md` - NPM_TOKEN setup section with granular token instructions and OIDC upgrade path

## Decisions Made

- `fail-fast: false` on smoke-test matrix so all platform results are visible even when one fails
- NPM_TOKEN documented in CONTRIBUTING.md as locked decision from CONTEXT.md
- OIDC upgrade path documented in both the workflow file comments and CONTRIBUTING.md for future reference

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Manual configuration required before publishing:**
1. Create a granular npm access token on npmjs.com with Read+Write permission for `create-ai-template`
2. Add it as a repository secret named `NPM_TOKEN` (Settings → Secrets and variables → Actions)
3. See `CONTRIBUTING.md` for full step-by-step instructions

## Next Phase Readiness

- Phase 5 packaging infrastructure complete pending human approval at checkpoint
- Full pipeline: `git push --tags` → smoke-test (3 OS) → publish to npm
- SEC-01 satisfied (dependabot.yml in plan 01)

---
*Phase: 05-packaging-and-maintenance*
*Completed: 2026-03-17*
