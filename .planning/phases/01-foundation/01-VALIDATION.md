---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest v4 |
| **Config file** | `wizard/vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `cd wizard && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd wizard && npx vitest run --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd wizard && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd wizard && npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | QA-05 | smoke | `cd wizard && npx vitest run tests/gitattributes.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 0 | AI-04 | unit | `cd wizard && npx vitest run tests/dependency-versions.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | AI-04 | unit | `cd wizard && npx vitest run tests/registry.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | AI-04 | unit | `cd wizard && npx vitest run tests/registry.test.ts -t "all versions pinned"` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 2 | QA-05 | smoke | `git ls-files --eol wizard/templates/husky/.husky/pre-commit` | ✅ shell | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `wizard/package.json` — scaffold with `vitest` as devDependency, `type: "commonjs"`
- [ ] `wizard/vitest.config.ts` — Vitest config for wizard package unit tests
- [ ] `wizard/tests/gitattributes.test.ts` — `.gitattributes` exists at repo root with `* text=auto eol=lf` and `*.sh text eol=lf` rules
- [ ] `wizard/tests/dependency-versions.test.ts` — all exports are non-empty strings, no `@latest` found
- [ ] `wizard/tests/registry.test.ts` — registry shape validation, all modules have required fields, all versions reference `dependency-versions.ts` constants (no inline version strings)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cloning on Windows produces LF-only files | QA-05 | Requires Windows checkout environment | Clone repo on Windows, run `git ls-files --eol wizard/templates/husky/.husky/pre-commit`, verify `i/lf` |
| Weekly CI cron resolves versions and opens PR | AI-04 | Requires real npm registry + GitHub Actions schedule trigger | Trigger `workflow_dispatch` on `check-versions` workflow, verify PR is created if a version is outdated |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
