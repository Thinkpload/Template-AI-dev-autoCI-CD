---
phase: 04-auto-bugfix-pipeline
plan: "03"
subsystem: infra
tags: [claude-code, slash-command, github-actions, gh-cli, ci-cd, loop-prevention]

# Dependency graph
requires:
  - phase: 04-auto-bugfix-pipeline
    provides: CI workflow with actor guard, structured issue creation, GitHub labels

provides:
  - /fix-issue Claude Code slash command at .claude/commands/fix-issue.md
  - Attempt counter logic (COUNT >= 3 → needs-human guard)
  - Loop prevention via [skip ci] commit message suffix
  - Zero-copy-paste issue fetch via !gh issue view at prompt-load time
  - PR creation with Closes #N reference and fix-attempt tracking comment

affects:
  - 04-auto-bugfix-pipeline
  - 05-release (developer tooling layer)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Claude Code slash command with !-prefixed prompt-time bash injection"
    - "[skip ci] commit suffix for CI loop prevention"
    - "<!-- fix-attempt --> HTML comment marker for machine-readable attempt counting"

key-files:
  created:
    - .claude/commands/fix-issue.md
  modified: []

key-decisions:
  - "!gh issue view $ARGUMENTS at prompt-load injects full issue JSON without copy-paste — satisfies CI-03 directly"
  - "COUNT >= 3 branch stops without a PR and applies needs-human label — satisfies CI-05 exhaustion guard"
  - "[skip ci] suffix on fix commit prevents push-triggered CI from re-opening the same issue — satisfies CI-04"
  - "<!-- fix-attempt --> HTML comment used as machine-parseable marker in gh api jq filter for exact count"

patterns-established:
  - "Slash command pattern: frontmatter + !-injected context + numbered steps + bash blocks"
  - "Attempt counter pattern: gh api jq filter on bot comments with HTML marker prefix"

requirements-completed: [CI-03, CI-04, CI-05]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 4 Plan 03: /fix-issue Slash Command Summary

**Developer-facing `/fix-issue <N>` slash command that auto-fetches GitHub issues, applies targeted fixes, posts `<!-- fix-attempt -->` tracking comments, enforces a 3-attempt cap with `needs-human` label, and commits with `[skip ci]` to prevent CI loop re-entry.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T20:54:53Z
- **Completed:** 2026-03-16T20:56:09Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `.claude/commands/fix-issue.md` — complete, executable Claude Code slash command
- Satisfies CI-03: `!gh issue view $ARGUMENTS` injects issue JSON at prompt-load time (zero copy-paste)
- Satisfies CI-04: `git commit -m "fix: resolve issue #$ARGUMENTS [skip ci]"` prevents push-triggered CI re-run
- Satisfies CI-05: COUNT >= 3 guard applies `needs-human` label and stops before opening any PR

## Task Commits

Each task was committed atomically:

1. **Task 1: Create /fix-issue slash command** - `c0d89c4` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `.claude/commands/fix-issue.md` — Full slash command: issue fetch, attempt counter, fix steps, [skip ci] commit, PR creation, tracking comment

## Decisions Made

- `!gh issue view $ARGUMENTS` with JSON fields `title,body,labels,number` gives the model full context without requiring developer copy-paste. The `!` prefix causes Claude Code to run the command at prompt-load time and inject stdout directly into the conversation.
- HTML comment `<!-- fix-attempt -->` as the tracking marker was chosen because it is invisible in rendered GitHub UI but reliably detectable via `jq startswith()` filter on the raw API response.
- COUNT is sourced from `github-actions[bot]` comments specifically, not all comments — prevents developer comments from inflating the counter.
- `[skip ci]` placement is in the commit message body (standard GitHub Actions convention), not a branch name, to avoid branch-naming complexity.

## Verification Output

All required markers confirmed present:

```
18:!gh issue view $ARGUMENTS --json title,body,labels,number
27:  --jq '[.[] | select(.user.login == "github-actions[bot]") | select(.body | startswith("<!-- fix-attempt -->"))] | length')
31:**If COUNT >= 3:**
32:- Run: `gh issue edit $ARGUMENTS --add-label "needs-human"`
33:- Run: `gh issue comment $ARGUMENTS --body "<!-- fix-attempt -->Auto-fix stopped after..."`
68:git commit -m "fix: resolve issue #$ARGUMENTS [skip ci]"
92:gh issue comment $ARGUMENTS --body "<!-- fix-attempt -->Fix attempt opened: PR created..."
```

npm test: 35/35 passing (wizard unit tests unaffected).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The command uses `gh` CLI which is already authenticated in developer environments.

## Next Phase Readiness

- `/fix-issue` command is complete and committed
- CI-03, CI-04, and CI-05 requirements are satisfied
- Phase 4 auto-bugfix pipeline is now fully operational: ci.yml creates issues on failure, `/fix-issue` applies fixes and opens PRs with loop prevention
- Phase 5 (release) can proceed

---
*Phase: 04-auto-bugfix-pipeline*
*Completed: 2026-03-16*
