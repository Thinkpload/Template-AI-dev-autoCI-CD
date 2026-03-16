---
phase: 5
slug: packaging-and-maintenance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | GitHub Actions CI matrix + npm pack smoke test |
| **Config file** | `.github/workflows/publish.yml` |
| **Quick run command** | `cd wizard && npm run build` |
| **Full suite command** | `cd wizard && npm run build && npm pack --dry-run` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd wizard && npm run build`
- **After every plan wave:** Run `cd wizard && npm run build && npm pack --dry-run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | SEC-01 | build | `cd wizard && npm run build` | ✅ | ⬜ pending |
| 5-01-02 | 01 | 1 | SEC-01 | smoke | `cd wizard && npm pack --dry-run` | ✅ | ⬜ pending |
| 5-02-01 | 02 | 1 | SEC-01 | config | `cat .github/dependabot.yml` | ❌ W0 | ⬜ pending |
| 5-02-02 | 02 | 1 | SEC-01 | workflow | `cat .github/workflows/dependabot-automerge.yml` | ❌ W0 | ⬜ pending |
| 5-03-01 | 03 | 2 | SEC-01 | CI | `cd wizard && npm run build && npm pack` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.github/dependabot.yml` — Dependabot config for npm at `/wizard` + github-actions at `/`
- [ ] `.github/workflows/dependabot-automerge.yml` — automerge workflow stub

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `npx create-ai-template` resolves on Windows (native) | SEC-01 | No WSL2 runner on GitHub Actions; `windows-latest` covers native Windows | Run `npx create-ai-template` in CMD/PowerShell and verify wizard completes without ERR_REQUIRE_ESM |
| Dependabot opens weekly PRs after merge | SEC-01 | Requires waiting for Dependabot schedule | Check GitHub repo → Insights → Dependency graph → Dependabot after first weekly cycle |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
