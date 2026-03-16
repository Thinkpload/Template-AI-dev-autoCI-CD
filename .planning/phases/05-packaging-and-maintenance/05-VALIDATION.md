---
phase: 5
slug: packaging-and-maintenance
status: draft
nyquist_compliant: true
wave_0_complete: true
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
| 05-01-T1 | 01 | 1 | SEC-01 | build + guard | `cd wizard && npm run build && node -e "Object.defineProperty(process.versions, 'node', { value: '18.0.0' }); require('./dist/index.cjs')" 2>&1 \| grep -q "requires Node.js 20" && echo OK` | ✅ | ⬜ pending |
| 05-01-T2 | 01 | 1 | SEC-01 | config | `test -f .github/dependabot.yml && test -f .github/workflows/dependabot-automerge.yml && echo OK` | ❌ created by task | ⬜ pending |
| 05-02-T1 | 02 | 2 | SEC-01 | workflow | `test -f .github/workflows/publish.yml && grep -q "needs: smoke-test" .github/workflows/publish.yml && echo OK` | ❌ created by task | ⬜ pending |
| 05-02-T2 | 02 | 2 | SEC-01 | docs | `test -f CONTRIBUTING.md && grep -q "NPM_TOKEN" CONTRIBUTING.md && echo OK` | ❌ created by task | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. The tasks in Plan 01 and Plan 02 create the config files from scratch — no pre-existing stubs are needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `npx create-ai-template` resolves on Windows (native) | SEC-01 | No WSL2 runner on GitHub Actions; `windows-latest` covers native Windows | Run `npx create-ai-template` in CMD/PowerShell and verify wizard completes without ERR_REQUIRE_ESM |
| Dependabot opens weekly PRs after merge | SEC-01 | Requires waiting for Dependabot schedule | Check GitHub repo → Insights → Dependency graph → Dependabot after first weekly cycle |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 not required — tasks create all files from scratch
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
