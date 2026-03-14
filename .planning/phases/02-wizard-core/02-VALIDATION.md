---
phase: 2
slug: wizard-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
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
| 2-01-01 | 01 | 0 | WIZ-01 | unit stub | `cd wizard && npm test -- --run` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | WIZ-01 | unit | `cd wizard && npm test -- --run` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | WIZ-02 | unit | `cd wizard && npm test -- --run` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 1 | WIZ-03 | unit | `cd wizard && npm test -- --run` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 1 | WIZ-05 | unit | `cd wizard && npm test -- --run` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 1 | WIZ-04 | unit | `cd wizard && npm test -- --run` | ❌ W0 | ⬜ pending |
| 2-04-01 | 04 | 1 | WIZ-06 | unit | `cd wizard && npm test -- --run` | ❌ W0 | ⬜ pending |
| 2-04-02 | 04 | 1 | WIZ-07 | unit | `cd wizard && npm test -- --run` | ❌ W0 | ⬜ pending |
| 2-05-01 | 05 | 1 | AI-01, AI-02, AI-03 | unit | `cd wizard && npm test -- --run` | ❌ W0 | ⬜ pending |
| 2-06-01 | 06 | 2 | WIZ-01 | e2e/manual | manual wizard run | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `wizard/src/__tests__/wizard.test.ts` — stubs for WIZ-01 through WIZ-07, AI-01–AI-03
- [ ] `wizard/src/__tests__/config.test.ts` — stubs for WIZ-03, WIZ-04
- [ ] `wizard/src/__mocks__/@clack/prompts.ts` — mock module for @clack/prompts API
- [ ] vitest already installed in wizard package.json (verify or add)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Welcome banner renders in terminal | WIZ-01 | @clack/prompts renders ANSI — not capturable in unit tests | Run `cd wizard && node dist/index.cjs`; verify banner appears |
| Full prompt flow end-to-end | WIZ-01, WIZ-02 | Interactive TTY required | Run wizard, step through all prompts, verify sequence matches spec |
| `npx create-ai-template` smoke test | WIZ-01 | Requires npm pack + install simulation | Run `cd wizard && npm pack && npx ./create-ai-template-*.tgz` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
