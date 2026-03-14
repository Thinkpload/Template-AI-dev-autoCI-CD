---
phase: 01-foundation
plan: 04
subsystem: infra
tags: [ci, github-actions, npm, version-pinning, cron, automation]

# Dependency graph
requires:
  - phase: 01-foundation/01-02
    provides: wizard/src/dependency-versions.ts with all pinned version constants
  - phase: 01-foundation/01-03
    provides: wizard/src/ directory structure that CI grep check targets
provides:
  - CI build step that fails on any @latest string in wizard/src/
  - Weekly scheduled workflow that resolves npm latest versions and opens PR on drift
  - check-versions.cjs script reading dependency-versions.ts and diffing against npm registry
affects:
  - All future PRs to wizard/src/ (enforced by CI check-no-latest step)
  - Phase 3 (installer) — version drift detected automatically, no manual monitoring needed

# Tech tracking
tech-stack:
  added: [peter-evans/create-pull-request@v7]
  patterns: [CI grep enforcement of version policy, scheduled npm drift detection, GitHub Actions output variables]

key-files:
  created:
    - wizard/scripts/check-versions.cjs
    - .github/workflows/version-check.yml
  modified:
    - .github/workflows/ci.yml
    - wizard/src/dependency-versions.ts

key-decisions:
  - "Separate version-check.yml workflow file (not added to ci.yml) keeps concerns cleanly separated and allows independent schedule trigger"
  - "grep -r @latest wizard/src/ with 2>/dev/null future-proofs the check for repos before wizard has been run"
  - "check-versions.cjs writes changes directly to dependency-versions.ts and sets GITHUB_OUTPUT changed=true — PR is opened by the workflow, not the script"
  - "Rewrote dependency-versions.ts file-header comments to remove literal @latest string that would false-positive the CI grep check"

patterns-established:
  - "Version enforcement pattern: grep CI check blocks violations at PR time; weekly cron closes the loop on intentional upgrades"
  - "GITHUB_OUTPUT dual-write pattern: appendFileSync for Actions environment + console.log ::set-output fallback"

requirements-completed: [AI-04]

# Metrics
duration: 12min
completed: 2026-03-15
---

# Phase 1 Plan 04: CI Version Enforcement Summary

**CI @latest grep guard in the build job plus a Monday cron that resolves npm latest, diffs dependency-versions.ts, and opens a PR when any version drifts**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-15T00:00:00Z
- **Completed:** 2026-03-15T00:12:00Z
- **Tasks:** 2 (+ 1 auto-fix)
- **Files modified:** 4

## Accomplishments

- CI build job now fails immediately if any `@latest` string appears anywhere under `wizard/src/`
- Weekly scheduled GitHub Actions workflow (`version-check.yml`) resolves current npm latest versions and opens a PR with bumped constants when drift is detected
- `wizard/scripts/check-versions.cjs` reads all 10 pinned packages from `dependency-versions.ts`, resolves npm registry versions, and sets `changed` output for the workflow

## Task Commits

1. **Task 1: Add @latest grep check to CI build job** - `4063b01` (feat)
2. **Task 2: Create check-versions.cjs and weekly workflow** - `2a10703` (feat)
3. **Auto-fix: Remove @latest literal from dependency-versions.ts comments** - `5a0ed87` (fix)

## Files Created/Modified

- `.github/workflows/ci.yml` - Added "Check no @latest in wizard source" step between Install dependencies and Lint
- `.github/workflows/version-check.yml` - New workflow: Monday 09:00 UTC cron + workflow_dispatch, opens PR via peter-evans/create-pull-request@v7
- `wizard/scripts/check-versions.cjs` - Node.js CJS script: reads dependency-versions.ts, queries npm registry for each of 10 packages, writes bumped file and sets changed=true output
- `wizard/src/dependency-versions.ts` - Rewrote file-header comments to remove literal @latest string (would have false-positived the grep check)

## Decisions Made

- Used a separate `version-check.yml` file rather than adding a second `on:` block to `ci.yml` — keeps concerns separated and schedule triggers are cleaner in their own file
- `grep -r "@latest" wizard/src/ 2>/dev/null` — `2>/dev/null` handles repos where wizard hasn't been run yet (no `wizard/src/` directory)
- `check-versions.cjs` writes the updated file in place and lets the workflow handle the PR — script stays single-concern
- `peter-evans/create-pull-request@v7` chosen for PR creation — well-maintained, handles branch creation and existing-PR updates automatically

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] False-positive @latest match in dependency-versions.ts comments**
- **Found during:** Task 2 verification (final grep -r @latest wizard/src/)
- **Issue:** The file-header comment in `dependency-versions.ts` contained the literal strings `@latest` (e.g., "No @latest anywhere in this file") — these would trigger the CI grep check and cause build failures on every push
- **Fix:** Rewrote the two comment lines to describe the same constraint without using the banned literal pattern
- **Files modified:** `wizard/src/dependency-versions.ts`
- **Verification:** `grep -r "@latest" wizard/src/` returns no output
- **Committed in:** `5a0ed87` (separate fix commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Fix was essential for correctness — without it the CI check would fail every build. No scope creep.

## Issues Encountered

None beyond the auto-fixed false-positive.

## User Setup Required

None - no external service configuration required. The `peter-evans/create-pull-request@v7` action uses the built-in `GITHUB_TOKEN`.

## Next Phase Readiness

- Phase 1 (Foundation) is now complete: registry, version pinning, templates, hooks, and CI enforcement are all in place
- Phase 2 (Wizard Core) can begin — `dependency-versions.ts` is the authoritative source and the CI guardrail is active
- The weekly drift workflow can be manually triggered via `workflow_dispatch` to verify it works end-to-end once the repo is on GitHub

---
*Phase: 01-foundation*
*Completed: 2026-03-15*
