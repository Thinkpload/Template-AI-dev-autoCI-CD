---
created: 2026-03-16T20:59:43.760Z
title: Phase 4 UAT — end-to-end pipeline testing
area: testing
files:
  - .github/workflows/ci.yml
  - .claude/commands/fix-issue.md
---

## Problem

Phase 4 (auto-bugfix pipeline) was built but the human verification checkpoint (04-04) was deferred. Three checks require live GitHub Actions runs and cannot be automated:

- **CI-02** — Structured issue body: push a broken test, verify the created GitHub Issue contains `**Job:**`, `**Branch:**`, `**Commit:**`, `**Run:**` fields
- **CI-03** — `/fix-issue` slash command: run `/fix-issue <issue-number>` in Claude Code, verify it reads the issue without copy-paste and opens a PR with `Closes #N`
- **CI-04** — No CI re-trigger: confirm the fix branch commit does NOT spawn a new CI run (due to `[skip ci]` in commit message)

CI-01 (Security Audit step present) and CI-05 (needs-human label after 3 attempts) were already verified by code inspection.

## Solution

1. Make a deliberate test failure (e.g. flip `toBe(true)` → `toBe(false)` in any wizard test)
2. Push to a test branch → wait for CI to fail → check the created Issue body
3. Run `/fix-issue <issue-number>` from Claude Code CLI → verify PR opened
4. Check GitHub Actions tab on the fix branch — no new run should appear
5. Revert the broken test
6. Reply "phase 4 approved" to the 04-04 checkpoint to finalize the phase
