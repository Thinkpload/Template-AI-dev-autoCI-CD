---
phase: 3
slug: installer-pipeline
status: completed
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-15
updated: 2026-03-17
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest v4.1.0 |
| **Config file** | wizard/vitest.config.ts |
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
| 3-01-01 | 01 | 0 | QA-01 | unit | `cd wizard && npm test -- --run installer` | ✅ | ✅ passing |
| 3-01-02 | 01 | 1 | QA-01 | unit | `cd wizard && npm test -- --run installer` | ✅ | ✅ passing |
| 3-01-03 | 01 | 1 | QA-01 | unit | `cd wizard && npm test -- --run installer` | ✅ | ✅ passing |
| 3-02-01 | 02 | 1 | QA-02 | unit | `cd wizard && npm test -- --run installer` | ✅ | ✅ passing |
| 3-02-02 | 02 | 1 | QA-02 | unit | `cd wizard && npm test -- --run installer` | ✅ | ✅ passing |
| 3-03-01 | 03 | 1 | QA-03 | unit | `cd wizard && npm test -- --run installer` | ✅ | ✅ passing |
| 3-03-02 | 03 | 1 | QA-03,QA-04 | unit | `cd wizard && npm test -- --run installer` | ✅ | ✅ passing |
| 3-04-01 | 04 | 2 | QA-01,QA-02,QA-03,QA-04 | integration | `cd wizard && npm test -- --run` | ✅ | ✅ passing |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky/failing*

---

## Wave 0 Requirements

- [x] `wizard/tests/installer.test.ts` — unit test stubs for all installer functions (QA-01, QA-02, QA-03, QA-04)
- [x] `wizard/tests/config.test.ts` — config read/write/merge tests
- [x] `wizard/tests/registry.test.ts` — MODULE_REGISTRY validation tests
- [x] `wizard/tests/wizard.test.ts` — wizard prompt flow tests
- [x] `wizard/tests/dependency-versions.test.ts` — version pinning tests
- [x] `wizard/tests/gitattributes.test.ts` — .gitattributes validation tests
- [x] `wizard/templates/husky/.husky/pre-commit` — hook script template (no shebang, LF endings)
- [x] `wizard/templates/husky/.husky/commit-msg` — hook script template (no shebang, LF endings)

*Wave 0 complete: All test files exist. Currently investigating vitest v4 compatibility issues.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `git commit` with staged file triggers pre-commit hook | QA-01 | Requires real git repo and actual Husky install | Run wizard in temp dir, select Husky, stage a file, run `git commit -m "test: verify"` |
| Commit with `"fixed stuff"` message is rejected | QA-02 | Requires real git repo with commitlint installed | Run wizard in temp dir, select commitlint, run `git commit -m "fixed stuff"` |
| `npm test` produces `coverage/lcov.info` | QA-03/QA-04 | Requires Vitest installed in target project | Run wizard in temp dir, select Vitest, run `npm test` |

---

## Validation Audit 2026-03-17

| Metric | Count |
|--------|-------|
| Test files created | 6 |
| Test suites | 6 |
| Passing tests | 35/35 ✅ |
| Manual-only verifications | 3 |

**Status:** All automated tests passing. Vitest v4 compatibility resolved through proper import patterns in test files. All 8 task requirements have automated verification coverage.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s (717ms full suite)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** COMPLETE — Phase 3 is Nyquist-compliant
