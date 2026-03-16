---
phase: 04-auto-bugfix-pipeline
plan: "01"
subsystem: infra
tags: [github-labels, ci, gh-cli]

# Dependency graph
requires:
  - phase: 03-installer-pipeline
    provides: CI workflow (ci.yml) that issues gh label commands on failure
provides:
  - "GitHub labels 'bug', 'ci-failure', and 'needs-human' pre-created in repository"
  - "Wave 0 prerequisite satisfied — Plans 02 and 03 can apply labels without 422 errors"
affects:
  - 04-auto-bugfix-pipeline (plans 02 and 03 use these labels directly)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave 0 label pre-creation: create gh labels before any workflow step references them"

key-files:
  created: []
  modified: []

key-decisions:
  - "Labels created with --force flag so plan is idempotent and safe to re-run"
  - "needs-human uses distinct red (#e11d48) to stand out in GitHub issue lists"
  - "This is a human-action checkpoint — gh label create requires live gh auth session that Claude cannot supply"

patterns-established:
  - "Wave 0 prerequisite pattern: infrastructure dependencies (labels, secrets, DNS) are created in dedicated Wave 0 plans before dependent Wave 1 plans execute"

requirements-completed: [CI-02, CI-05]

# Metrics
duration: ~5min (human action)
completed: 2026-03-16
---

# Phase 4 Plan 01: GitHub Repository Labels — Pre-creation Summary

**Three GitHub labels pre-created (`bug` #d73a4a, `ci-failure` #e4e669, `needs-human` #e11d48) enabling Plans 02-03 to apply labels in gh CLI calls without 422 errors**

## Performance

- **Duration:** ~5 min (human action)
- **Started:** 2026-03-16 (continuation from checkpoint)
- **Completed:** 2026-03-16T20:48:44Z
- **Tasks:** 1
- **Files modified:** 0 (GitHub API only — no repo files changed)

## Accomplishments

- `bug` label created with color `#d73a4a` — used by `gh issue create --label "bug,ci-failure"` in the CI failure reporter step
- `ci-failure` label created with color `#e4e669` — paired with `bug` on every auto-created issue
- `needs-human` label created with color `#e11d48` (distinct red) — applied by fix-issue.md when attempt limit is exceeded

## Task Commits

This plan contained a single `type="checkpoint:human-action"` task. Labels were created directly in the GitHub API via the user's authenticated `gh` CLI session — no code files were modified, so no task-level git commit was produced. Plan metadata will be committed with the SUMMARY and state update.

## Files Created/Modified

None — this plan exclusively provisions GitHub repository metadata (labels). No source files, workflow files, or config files were changed.

## Decisions Made

- `--force` flag used on all three `gh label create` commands so the plan is idempotent: re-running updates color/description without errors if labels already exist.
- `needs-human` was given a visually distinct red (`#e11d48`) separate from the standard GitHub red (`#d73a4a`) used for `bug`, ensuring it stands out in issue triage lists.
- This task was correctly classified as `checkpoint:human-action` because `gh label create` requires a live, user-authenticated GitHub session — it cannot be performed by Claude without the user's active `gh auth` context.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — the three labels have been created. No further external service configuration is required before proceeding to Plan 02.

## Next Phase Readiness

- All three required labels exist in the GitHub repository
- Plan 02 (CI failure reporter workflow step) can safely call `gh issue create --label "bug,ci-failure"` without receiving a 422 error
- Plan 03 (fix-issue.md attempt-limit guard) can safely call `gh issue edit --add-label "needs-human"` without receiving a 422 error
- Wave 1 plans (02 and 03) are unblocked

---
*Phase: 04-auto-bugfix-pipeline*
*Completed: 2026-03-16*
