---
phase: 4
slug: auto-bugfix-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest v4 (already configured in wizard/) |
| **Config file** | `wizard/vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | CI-02, CI-05 | manual-prereq | `gh label list` | ✅ | ⬜ pending |
| 4-02-01 | 02 | 1 | CI-01 | manual | `npm audit --audit-level=high` | ✅ | ⬜ pending |
| 4-03-01 | 03 | 1 | CI-02 | manual | CI run observation | ✅ W0 | ⬜ pending |
| 4-04-01 | 04 | 2 | CI-03 | manual | `/fix-issue <n>` in Claude Code | ✅ W0 | ⬜ pending |
| 4-05-01 | 05 | 2 | CI-04 | manual | Push observation + actor guard | ✅ W0 | ⬜ pending |
| 4-06-01 | 06 | 3 | CI-05 | manual | 3-attempt scenario in CI | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Pre-create repository labels: `bug`, `ci-failure`, `needs-human` via `gh label create`
- [ ] No new Vitest test files needed — all CI-0x requirements are manual/integration-only

*Existing infrastructure (Vitest) covers wizard unit tests. CI behaviors are GitHub Actions integration — manual UAT only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `npm audit --audit-level=high` exits non-zero on high/critical | CI-01 | Requires real vulnerable package in repo | Add temp high-severity dep, run `npm audit --audit-level=high`, verify non-zero exit |
| Issue created with job name, SHA, branch, error excerpt | CI-02 | Requires actual CI run to fail | Introduce a failing test, push to branch, verify issue opened with all 4 fields |
| `/fix-issue 42` reads issue and opens PR | CI-03 | Requires live GitHub API + Claude Code | Run `/fix-issue <real-issue-number>`, verify PR opened with fix applied |
| Fix commit does not re-trigger CI | CI-04 | Requires push observation on GitHub | Merge fix PR, verify no new CI run triggered for that commit |
| After 3 attempts, `needs-human` label added, no new PR | CI-05 | Requires 3 consecutive failed fix PRs | Trigger `/fix-issue` 3× on same issue with unfixable bug, verify label + no 4th PR |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
