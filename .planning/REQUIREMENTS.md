# Requirements: AI Dev Template — Universal Project Setup Wizard

**Defined:** 2026-03-14
**Core Value:** One command sets up a complete AI-driven development environment tailored to your needs — so the first day of a new project is spent building product, not configuring tooling.

## v1 Requirements

### Wizard Core

- [ ] **WIZ-01**: User can run the wizard via `./setup.sh` or `npx` and see an interactive prompt sequence
- [ ] **WIZ-02**: Wizard presents module categories with checkboxes for multi-select and radio-selects for mutually exclusive choices (ORM, Auth)
- [ ] **WIZ-03**: Wizard writes `.template-config.json` with selected modules and install state after completion
- [ ] **WIZ-04**: Re-running the wizard skips already-installed modules (idempotency guard via `.template-config.json`)
- [ ] **WIZ-05**: Wizard detects conflicting module selections (e.g., Prisma + Drizzle simultaneously) and shows an error before any installation starts
- [ ] **WIZ-06**: Wizard supports `--yes` / `--skip` flag for non-interactive/CI mode using sensible defaults
- [ ] **WIZ-07**: Wizard gracefully handles install failures — logs error, continues with remaining modules, summarizes failures at end

### AI Methodology

- [ ] **AI-01**: User can select BMAD methodology — wizard installs BMAD v6 via npm from official public repo (`@bmad-method/bmad-agent`)
- [ ] **AI-02**: User can select GSD workflow engine — wizard confirms GSD is active (already in repo) or updates to latest pinned version
- [ ] **AI-03**: User can select both BMAD and GSD — both are installed and configured without conflicts
- [ ] **AI-04**: Template pins BMAD and GSD to specific versions with a documented upgrade path (prevents silent version drift breaking agent discovery)

### Code Quality

- [ ] **QA-01**: Wizard installs and configures Husky v9 + lint-staged v15 — pre-commit hook runs linter on staged files
- [ ] **QA-02**: Wizard installs and configures commitlint v19 — commit-msg hook enforces conventional commits format
- [ ] **QA-03**: Wizard installs and configures Vitest v4 with coverage thresholds (80% statements/functions/lines, 70% branches)
- [ ] **QA-04**: Vitest config is pre-wired to output `coverage/lcov.info` for SonarCloud consumption
- [ ] **QA-05**: Template ships `.gitattributes` with `eol=lf` for all hook scripts (prevents Windows `\r\n` breaking Husky on Linux CI)

### CI/CD

- [ ] **CI-01**: CI pipeline includes `npm audit --audit-level=high` step — build fails on high/critical vulnerabilities
- [ ] **CI-02**: CI failure triggers automatic GitHub Issue creation with structured context: failing job name, error log excerpt, commit SHA, branch name
- [ ] **CI-03**: User can run `/fix-issue <issue-number>` slash command in Claude Code — AI agent reads the issue, applies a fix, and opens a PR
- [ ] **CI-04**: Auto-bugfix workflow uses `GITHUB_TOKEN` (not PAT) + actor filter + `[skip ci]` on fix commits to prevent infinite CI loop
- [ ] **CI-05**: Auto-bugfix workflow tracks fix-attempt count per issue — stops after 3 failed attempts and adds a `needs-human` label

### Security & Dependencies

- [ ] **SEC-01**: Template ships `.github/dependabot.yml` — weekly dependency update PRs grouped by minor+patch, automerge patch bumps

## v2 Requirements

### Agentic System Setup

- **AGT-01**: Wizard detects or asks which agentic system is used (Claude Code, Cursor, VS Code) and copies appropriate config files
- **AGT-02**: Wizard creates `.cursor/rules/*.mdc` files for Cursor users (new MDC format, not deprecated `.cursorrules`)
- **AGT-03**: Wizard scaffolds `CLAUDE.md` for Claude Code users with project-specific context

### Code Quality (Extended)

- **QA-EXT-01**: Wizard installs and configures ESLint v9+ flat config (`eslint.config.mjs`) + Prettier v3 + EditorConfig
- **QA-EXT-02**: Wizard installs TypeScript strict mode config (`tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess`, `@/*` alias)
- **QA-EXT-03**: Wizard installs `@t3-oss/env-nextjs` + Zod for type-safe env var validation

### Security (Extended)

- **SEC-EXT-01**: Template ships GitHub CodeQL workflow (`codeql.yml`) — semantic analysis on every PR
- **SEC-EXT-02**: Template ships security headers in `next.config.mjs` (X-Frame-Options, HSTS, CSP, X-Content-Type-Options)

### SaaS Modules (Stubs)

- **SAAS-01**: Wizard offers optional install of Better Auth v1 or Clerk v6 (mutually exclusive)
- **SAAS-02**: Wizard offers optional install of Prisma v7 or Drizzle ORM v0.38+ (mutually exclusive)
- **SAAS-03**: Wizard offers optional install of Stripe + React Email + Resend stubs

### Maintenance Infrastructure

- **MAINT-01**: Scheduled weekly smoke-test CI workflow — clones the template, runs the wizard in `--yes` mode, verifies output
- **MAINT-02**: Dependabot configured on the template repo itself (not just user projects)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full SaaS app scaffold (complete auth + DB + payments + UI) | v2; maintaining a full stack template requires dedicated effort — scope creep would derail v1 |
| Web UI / browser-based wizard | Over-engineered for v1; CLI fits the terminal-native AI developer workflow |
| Fully automated AI PRs on CI failure (no human trigger) | High false-positive risk; human-triggered `/fix-issue` preserves control; true automation is v3+ |
| Monorepo support | Single-repo-first; turborepo/nx configuration is a separate problem |
| Custom AI model training or fine-tuning | Uses BMAD/GSD as-is from official repos |
| VS Code extension marketplace publishing | The template ships `.vscode/` config; publishing a separate extension is a separate project |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| WIZ-01 | Phase 2 | Pending |
| WIZ-02 | Phase 2 | Pending |
| WIZ-03 | Phase 2 | Pending |
| WIZ-04 | Phase 2 | Pending |
| WIZ-05 | Phase 2 | Pending |
| WIZ-06 | Phase 2 | Pending |
| WIZ-07 | Phase 2 | Pending |
| AI-01 | Phase 2 | Pending |
| AI-02 | Phase 2 | Pending |
| AI-03 | Phase 2 | Pending |
| AI-04 | Phase 1 | Pending |
| QA-01 | Phase 3 | Pending |
| QA-02 | Phase 3 | Pending |
| QA-03 | Phase 3 | Pending |
| QA-04 | Phase 3 | Pending |
| QA-05 | Phase 1 | Pending |
| CI-01 | Phase 4 | Pending |
| CI-02 | Phase 4 | Pending |
| CI-03 | Phase 4 | Pending |
| CI-04 | Phase 4 | Pending |
| CI-05 | Phase 4 | Pending |
| SEC-01 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-14 after roadmap creation*
