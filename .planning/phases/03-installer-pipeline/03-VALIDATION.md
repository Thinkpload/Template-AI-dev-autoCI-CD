---
phase: 3
slug: installer-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (wizard/src tests) |
| **Config file** | wizard/vitest.config.ts (existing) |
| **Quick run command** | `cd wizard && npm test -- --run` |
| **Full suite command** | `cd wizard && npm test -- --run --coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd wizard && npm test -- --run`
- **After every plan wave:** Run `cd wizard && npm test -- --run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | QA-01 | unit | `cd wizard && npm test -- --run installer` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | QA-01 | unit | `cd wizard && npm test -- --run installer` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | QA-01 | unit | `cd wizard && npm test -- --run installer` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | QA-02 | unit | `cd wizard && npm test -- --run installer` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | QA-02 | unit | `cd wizard && npm test -- --run installer` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 1 | QA-03 | unit | `cd wizard && npm test -- --run installer` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 1 | QA-03,QA-04 | unit | `cd wizard && npm test -- --run installer` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | QA-01,QA-02,QA-03,QA-04 | integration | `cd wizard && npm test -- --run e2e` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `wizard/src/__tests__/installer.test.ts` — unit test stubs for all installer functions (QA-01, QA-02, QA-03, QA-04)
- [ ] `wizard/src/__tests__/merge-package-json.test.ts` — targeted key injection tests
- [ ] `wizard/templates/husky/pre-commit` — hook script template (no shebang, LF endings)
- [ ] `wizard/templates/husky/commit-msg` — hook script template (no shebang, LF endings)

*Wave 0 creates both test stubs and missing template files.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `git commit` with staged file triggers pre-commit hook | QA-01 | Requires real git repo and actual Husky install | Run wizard in temp dir, select Husky, stage a file, run `git commit -m "test: verify"` |
| Commit with `"fixed stuff"` message is rejected | QA-02 | Requires real git repo with commitlint installed | Run wizard in temp dir, select commitlint, run `git commit -m "fixed stuff"` |
| `npm test` produces `coverage/lcov.info` | QA-03/QA-04 | Requires Vitest installed in target project | Run wizard in temp dir, select Vitest, run `npm test` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
