---
phase: 2
slug: wizard-core
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-15
audited: 2026-03-17
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | wizard/vitest.config.ts |
| **Test directory** | wizard/tests/ |
| **Quick run command** | `cd wizard && npm test -- --run` |
| **Full suite command** | `cd wizard && npm test -- --run --coverage` |
| **Estimated runtime** | ~1 second (actual: 603ms) |

---

## Sampling Rate

- **After every task commit:** Run `cd wizard && npm test -- --run`
- **After every plan wave:** Run `cd wizard && npm test -- --run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Test File | Status |
|---------|------|------|-------------|-----------|-------------------|-----------|--------|
| 2-01-01 | 01 | 0 | WIZ-03, WIZ-04 | unit | `cd wizard && npm test -- --run` | wizard/tests/config.test.ts | ✅ green |
| 2-01-02 | 01 | 0 | WIZ-01–WIZ-07, AI-01–AI-03 | unit stub | `cd wizard && npm test -- --run` | wizard/tests/wizard.test.ts | ✅ green |
| 2-02-01 | 02 | 1 | WIZ-02, WIZ-04, WIZ-05, WIZ-06, AI-01–AI-03 | unit | `cd wizard && npm test -- --run` | wizard/tests/wizard.test.ts | ✅ green |
| 2-03-01 | 03 | 1 | WIZ-01, WIZ-03, WIZ-06, WIZ-07 | unit | `cd wizard && npm test -- --run` | wizard/tests/config.test.ts, wizard/tests/wizard.test.ts | ✅ green |
| 2-04-01 | 04 | 2 | WIZ-01, WIZ-02, WIZ-04 | unit | `cd wizard && npm test -- --run` | wizard/tests/wizard.test.ts | ✅ green |
| 2-06-01 | — | manual | WIZ-01 | e2e/manual | manual wizard run | N/A | ✅ approved (02-04 checkpoint) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Completion

- [x] `wizard/tests/wizard.test.ts` — 7 unit tests covering WIZ-01 through WIZ-07, AI-01–AI-03
- [x] `wizard/tests/config.test.ts` — 5 unit tests covering WIZ-03, WIZ-04, WIZ-07
- [x] `wizard/tests/registry.test.ts` — 5 unit tests (MODULE_REGISTRY structure)
- [x] `wizard/tests/dependency-versions.test.ts` — 3 unit tests (version pinning, AI-04)
- [x] `wizard/tests/installer.test.ts` — 13 unit tests covering WIZ-07, AI-01–AI-03
- [x] `wizard/tests/gitattributes.test.ts` — 2 unit tests (repo config)
- [x] vitest installed and configured in wizard/package.json

**Total: 35 tests, all GREEN (verified 2026-03-17)**

---

## Requirement Coverage Summary

| Requirement | Tests | Status |
|-------------|-------|--------|
| WIZ-01 (entry point) | wizard.test.ts: --yes mode, prompt sequence; manual: 02-04 checkpoint | ✅ COVERED |
| WIZ-02 (multi-select prompts) | wizard.test.ts: prompt sequence calls select x2, multiselect x1 | ✅ COVERED |
| WIZ-03 (writes config) | config.test.ts: round-trip, writeConfig format | ✅ COVERED |
| WIZ-04 (idempotency) | wizard.test.ts: installed modules excluded; config.test.ts: round-trip | ✅ COVERED |
| WIZ-05 (conflict detection) | wizard.test.ts: conflict detection, validateConflicts unit test | ✅ COVERED |
| WIZ-06 (--yes mode) | wizard.test.ts: --yes mode returns must-have + bmad + gsd without prompts | ✅ COVERED |
| WIZ-07 (graceful failure) | installer.test.ts: failed status continues; config.test.ts: InstallState contract | ✅ COVERED |
| AI-01 (BMAD via npm) | installer.test.ts: npm install --save-dev with devDeps | ✅ COVERED |
| AI-02 (GSD active) | wizard.test.ts: both bmad and gsd in --yes selectedModules | ✅ COVERED |
| AI-03 (BMAD + GSD) | wizard.test.ts: both bmad and gsd included | ✅ COVERED |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Status |
|----------|-------------|------------|--------|
| Welcome banner renders in terminal | WIZ-01 | @clack/prompts renders ANSI — not capturable in unit tests | ✅ Verified (02-04 human checkpoint) |
| Full prompt flow end-to-end | WIZ-01, WIZ-02 | Interactive TTY required | ✅ Verified (02-04 human checkpoint) |
| `npx create-ai-template` smoke test | WIZ-01 | Requires npm pack + install simulation | ✅ Verified (02-04 human checkpoint) |

---

## Validation Sign-Off

- [x] All tasks have automated verify or manual approval
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 complete — all test files created and GREEN
- [x] No watch-mode flags
- [x] Feedback latency < 15s (actual: 603ms)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-03-17

---

## Validation Audit 2026-03-17
| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Tests verified GREEN | 35 |
| Requirements COVERED | 10/10 |

*Audit note: VALIDATION.md was created pre-execution as a scaffold. All Wave 0 tests exist in `wizard/tests/` (not `wizard/src/__tests__/` as originally planned). All 35 tests pass. Status updated from draft/pending to complete/nyquist_compliant.*
