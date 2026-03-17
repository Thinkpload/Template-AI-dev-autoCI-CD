---
phase: 1
slug: foundation
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-15
audited: 2026-03-17
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest v4 |
| **Config file** | `wizard/vitest.config.ts` |
| **Quick run command** | `cd wizard && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd wizard && npx vitest run --coverage` |
| **Estimated runtime** | ~620ms (35 tests) |

---

## Sampling Rate

- **After every task commit:** Run `cd wizard && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd wizard && npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | QA-05 | smoke | `cd wizard && npx vitest run tests/gitattributes.test.ts` | ✅ | ✅ green |
| 1-01-02 | 01 | 0 | AI-04 | unit | `cd wizard && npx vitest run tests/dependency-versions.test.ts` | ✅ | ✅ green |
| 1-01-03 | 01 | 1 | AI-04 | unit | `cd wizard && npx vitest run tests/registry.test.ts` | ✅ | ✅ green |
| 1-01-04 | 01 | 1 | AI-04 | unit | `cd wizard && npx vitest run tests/registry.test.ts -t "all versions pinned"` | ✅ | ✅ green |
| 1-01-05 | 01 | 2 | QA-05 | smoke | `cd wizard && npx vitest run tests/installer.test.ts -t "LF endings"` | ✅ | ✅ green |
| 1-02-01 | 02 | 2 | AI-04 | unit | `cd wizard && npx vitest run tests/dependency-versions.test.ts tests/registry.test.ts` | ✅ | ✅ green |
| 1-03-01 | 03 | 2 | AI-04/QA-05 | unit | `cd wizard && npx vitest run tests/wizard.test.ts tests/config.test.ts` | ✅ | ✅ green |
| 1-03-02 | 03 | 2 | QA-05 | unit | `cd wizard && npx vitest run tests/installer.test.ts` | ✅ | ✅ green |
| 1-04-01 | 04 | 3 | AI-04 | manual | — see Manual-Only | n/a | ⬜ manual |
| 1-04-02 | 04 | 3 | AI-04 | manual | — see Manual-Only | n/a | ⬜ manual |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `wizard/package.json` — scaffold with `vitest` as devDependency, `type: "commonjs"`
- [x] `wizard/vitest.config.ts` — Vitest config for wizard package unit tests
- [x] `wizard/tests/gitattributes.test.ts` — `.gitattributes` exists at repo root with `* text=auto eol=lf` and `*.sh text eol=lf` rules
- [x] `wizard/tests/dependency-versions.test.ts` — all exports are non-empty strings, no `@latest` found
- [x] `wizard/tests/registry.test.ts` — registry shape validation, all modules have required fields, all versions reference `dependency-versions.ts` constants (no inline version strings)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cloning on Windows produces LF-only files | QA-05 | Requires Windows checkout environment | Clone repo on Windows, run `git ls-files --eol wizard/templates/husky/.husky/pre-commit`, verify `i/lf` |
| Weekly CI cron resolves versions and opens PR | AI-04 | Requires real npm registry + GitHub Actions schedule trigger | Trigger `workflow_dispatch` on `check-versions` workflow, verify PR is created if a version is outdated |
| CI build fails when `@latest` appears in `wizard/src/` | AI-04 | GitHub Actions workflow behavior — cannot unit-test CI step execution | Temporarily add `@latest` to a version constant, push to a branch, confirm `check-no-latest` step fails |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-03-17

---

## Validation Audit 2026-03-17

| Metric | Count |
|--------|-------|
| Gaps found | 5 |
| Resolved (status updated to ✅ green) | 5 |
| Newly mapped tasks (Plans 02–03) | 3 |
| Escalated to manual-only (Plan 04 CI) | 1 |
| Total tests passing | 35 |
