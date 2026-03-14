# AI Dev Template — Universal Project Setup Wizard

## What This Is

A public GitHub template repository that turns any new project into a production-ready AI-driven development environment in minutes. A CLI-based interactive setup wizard asks what you need (AI methodology, agentic system, code quality tools, SaaS modules) and installs + configures everything from public repos automatically — no manual hunting for configs, no copy-paste boilerplate.

The template ships with BMAD v6, GSD workflow engine, GitHub Actions CI/CD, SonarCloud, and an auto-bugfix pipeline already wired up. The wizard activates additional layers on demand.

## Core Value

**One command sets up a complete AI-driven development environment tailored to your needs** — so the first day of a new project is spent building product, not configuring tooling.

## Requirements

### Validated

- ✓ BMAD v6 AI agent workflows installed and operational — existing
- ✓ GSD (Get Shit Done) workflow engine with Claude/Gemini/OpenCode support — existing
- ✓ GitHub Actions CI/CD pipeline (lint → test → SonarCloud → build) — existing
- ✓ SonarCloud static analysis integration (`sonar-project.properties`) — existing
- ✓ Auto-bugfix workflow (CI failure → GitHub Issue creation) — existing
- ✓ `.env.example` with standard SaaS variables — existing
- ✓ Basic `setup.sh` for post-clone initialization — existing

### Active

**Setup Wizard:**
- [ ] Interactive CLI wizard (`setup.sh` or `npx`) that asks questions and installs selected modules
- [ ] AI methodology selection: BMAD, GSD, or both — installs from official public npm packages
- [ ] Agentic system selection: Claude Code, VS Code + extensions, Cursor — configures appropriate config files
- [ ] Module selection UI: multi-choice selection of Must-Have, Should-Have, Nice-to-Have modules
- [ ] Wizard persists selections to `.template-config.json` for reproducibility

**Must-Have Modules (pre-configured, activated by wizard):**
- [ ] Husky v9 + lint-staged v15 + commitlint v19 (git hooks, conventional commits)
- [ ] Prettier v3 + EditorConfig + ESLint v9+ flat config (`eslint.config.mjs`)
- [ ] Vitest v4 with coverage thresholds (80% statements/functions/lines, 70% branches)
- [ ] TypeScript strict mode (`tsconfig.json` with `noUncheckedIndexedAccess`)
- [ ] `@t3-oss/env-nextjs` + Zod — type-safe env var validation
- [ ] GitHub Issue templates (bug report, feature request) + PR template
- [ ] Security headers in `next.config.mjs`
- [ ] GitHub CodeQL workflow + Dependabot config

**CI/CD Enhancements:**
- [ ] Auto-bugfix workflow creates GitHub Issues on CI failure with structured context
- [ ] AI fix command (single slash command triggers AI agent to attempt automated fix)
- [ ] `npm audit --audit-level=high` step in CI pipeline

**Wizard Quality:**
- [ ] Works on macOS, Linux, and Windows (WSL)
- [ ] Graceful fallback if a module install fails (logs error, continues)
- [ ] Idempotent — running wizard twice doesn't break anything

### Out of Scope

- Full SaaS application scaffold (auth, DB, payments, UI components) — v2; wizard stubs documented but not wired in v1
- Web UI for the wizard — CLI is sufficient, browser-based wizard is over-engineered for v1
- Monorepo support — single-repo template first
- Custom AI agent training or fine-tuning — uses existing BMAD/GSD as-is

## Context

**Existing state:** BMAD v6 + GSD engine + CI/CD + SonarCloud are operational. The gap is: (1) there is no interactive wizard to activate modules, and (2) the Must-Have code quality tools (Husky, ESLint, Prettier, Vitest, etc.) are documented in research but not yet wired into the template.

**Target users:** Solo developers using AI agents (Claude Code, Cursor) to build SaaS products fast, AND small teams (2–5 people) who need conventional commits, code review gates, and branch protection. The wizard adapts — it asks "team size?" and includes CODEOWNERS/branch protection config for teams.

**Competitive landscape:** `create-t3-app` is the gold standard for interactive CLI setup. `ixartz/SaaS-Boilerplate`, `boxyhq/saas-starter-kit` ship full SaaS stacks but are opinionated and non-modular. This template's differentiation: AI-first (BMAD + GSD built-in), modular (pick what you need), and infrastructure-independent (not locked to Vercel or any SaaS platform).

**Research:** `research/RESEARCH-template-technologies.md` contains a 44-module analysis with install commands, priority levels, and pre-install vs setup.sh decisions. Treat as a reference, not gospel — versions should be verified at implementation time.

**Auto-bugfix workflow:** CI failure triggers a GitHub Issue with structured context (failing job, error log, diff). Developer runs `/fix-issue <issue-number>` inside Claude Code → AI agent reads the issue, applies fix, opens PR. This is the most novel feature and should be showcased prominently.

## Constraints

- **Tech Stack**: Node.js ≥ 20, bash, npm — wizard must not require any additional runtime (no Python, no Go)
- **Public repo**: No secrets or API keys committed; all sensitive config goes in `.env.example` with clear instructions
- **AI-agnostic core**: The base template (CI/CD, code quality) must work without any AI tooling installed
- **No lock-in**: Module choices are reversible; wizard documents how to uninstall each module

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI wizard over web UI | Developers using AI agents live in the terminal; a CLI fits the workflow. Lower build complexity for v1. | — Pending |
| Ship Must-Have configs pre-installed, activated by wizard | Configs (ESLint flat config, Prettier, commitlint) are non-trivial to generate correctly; pre-shipping ensures quality. Wizard runs the install commands only. | — Pending |
| BMAD + GSD both included by default, not optional | This repo already has both; removing either would break existing users. Wizard allows disabling one if not needed. | — Pending |
| Auto-bugfix uses slash command, not full automation | Fully automated AI PRs on CI failure have high false-positive risk. Human-triggered (`/fix-issue`) preserves control. | — Pending |
| ESLint v9+ flat config only | ESLint 10 (Feb 2026) removed legacy `.eslintrc`; shipping flat config from day one avoids migration debt | — Pending |

---
*Last updated: 2026-03-14 after initialization*
