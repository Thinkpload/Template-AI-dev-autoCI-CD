---
phase: 04-auto-bugfix-pipeline
plan: "02"
subsystem: infra
tags: [github-actions, npm-audit, ci, security-scanning, issue-creation, loop-prevention]

# Dependency graph
requires:
  - phase: 04-auto-bugfix-pipeline plan 01
    provides: GitHub labels (bug, ci-failure, needs-human) pre-created in repo
provides:
  - Security Audit step in ci.yml (npm audit --audit-level=high)
  - Structured CI failure issue body with job name, commit SHA, branch name
  - Job-level actor guard preventing github-actions[bot] from re-triggering build
  - audit.log captured in issue body alongside lint/test/build logs
affects: [04-auto-bugfix-pipeline, ci-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "npm audit --audit-level=high > audit.log 2>&1 || (cat audit.log && exit 1) — fails on high/critical only, prints log before failing"
    - "Job-level actor guard: if: github.actor != 'github-actions[bot]' — prevents bot-triggered build loops"
    - "Structured issue body using bash group redirect { ... } > file — avoids shell escaping issues"

key-files:
  created: []
  modified:
    - .github/workflows/ci.yml

key-decisions:
  - "Actor guard placed at job level (not step level) so earlier steps like checkout do not run for bot-triggered events"
  - "Emoji prefix removed from issue title for machine-parseability — title is now 'CI Failed: <job> on <branch> (#<run>)'"
  - "audit.log added first in issue body log section so security failures are most prominent"

patterns-established:
  - "Pattern: Log-capture pattern for CI steps — command > file.log 2>&1 || (cat file.log && exit 1) applied consistently for audit, lint, test, build"
  - "Pattern: Structured issue body with group redirect { echo ... } > file ensures all fields present atomically"

requirements-completed: [CI-01, CI-02, CI-04]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 4 Plan 02: CI Security Audit, Structured Issue Body, and Actor Guard Summary

**Extended ci.yml with npm audit security scanning, structured GitHub Issue creation (job/SHA/branch), and job-level bot actor guard — satisfying CI-01, CI-02, and CI-04.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T20:50:43Z
- **Completed:** 2026-03-16T20:52:36Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added Security Audit step using `npm audit --audit-level=high` that exits non-zero only on high/critical vulnerabilities — output redirected to `audit.log` for capture in issue body
- Added job-level actor guard `if: github.actor != 'github-actions[bot]'` to prevent bot-triggered infinite build loops
- Completed structured issue body in Report CI Failure step with `github.job`, `github.ref_name`, `github.sha`, and run URL header block
- Added `audit.log` capture to issue body alongside existing lint/test/build logs
- Updated issue label from `bug` to `bug,ci-failure` and title to include job name (removed emoji prefix)
- All 35 wizard unit tests continue to pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Add actor guard and Security Audit step to ci.yml** - `7c46940` (feat)
2. **Task 2: Complete structured issue body in Report CI Failure step** - `43e8e5e` (feat)

**Plan metadata:** committed with final docs commit

## Files Created/Modified

- `.github/workflows/ci.yml` - Added actor guard (line 13), Security Audit step (lines 35-36), restructured Report CI Failure step body with job/SHA/branch header and audit.log capture, updated label and title

## Decisions Made

- Actor guard placed at job level so checkout/setup steps do not run for bot-triggered events (belt-and-suspenders alongside GITHUB_TOKEN's built-in loop prevention)
- Emoji prefix removed from CI failure issue title — `CI Failed: <job> on <branch> (#<run>)` is machine-parseable and matches the format expected by future `/fix-issue` slash command
- `audit.log` capture placed first in the log section so security failures are most prominent in the issue body

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Lines Changed in ci.yml

**Actor guard (Task 1):**
- Line 13: `if: github.actor != 'github-actions[bot]'` — added between `runs-on: ubuntu-latest` and `permissions:`

**Security Audit step (Task 1):**
- Lines 35-36: New step between "Install dependencies" and "Check no @latest"
- `run: npm audit --audit-level=high > audit.log 2>&1 || (cat audit.log && exit 1)`

**Report CI Failure step body (Task 2):**
- Lines 66-72: Replaced single echo with group redirect block writing job/branch/commit/run fields
- Lines 73-78: Added audit.log capture block (first in log section)
- Line 102: Updated title to `CI Failed: ${{ github.job }} on ${{ github.ref_name }} (#${{ github.run_number }})`
- Line 104: Updated label from `bug` to `bug,ci-failure`

## Verified grep Output

```
github.actor != 'github-actions[bot]'   → line 13 (job level)
npm audit --audit-level=high             → line 36 (Security Audit step)
github.job                               → lines 67, 102 (issue body + title)
github.ref_name                          → lines 68, 102 (issue body + title)
github.sha                               → line 69 (issue body)
ci-failure                               → line 104 (label)
audit.log capture                        → lines 73-78 (issue body)
```

## Next Phase Readiness

- CI-01, CI-02, CI-04 requirements satisfied
- Wave 1 of Phase 4 complete
- Ready for Phase 4 Plan 03 (CI-03: `/fix-issue` slash command) and Plan 04 (CI-05: attempt counter + needs-human label)

---
*Phase: 04-auto-bugfix-pipeline*
*Completed: 2026-03-16*
