# Project Research Summary

**Project:** AI-First Developer Project Template + Interactive Setup Wizard
**Domain:** Interactive CLI setup wizard (npx package) + AI-native Next.js project template
**Researched:** 2026-03-14
**Confidence:** HIGH (stack, features, pitfalls); MEDIUM (architecture details)

## Executive Summary

This project is an AI-native developer project template distributed as a public GitHub template, paired with an interactive `npx` setup wizard. Research confirms the template occupies an uncontested competitive position: no existing template (create-t3-app, ixartz/SaaS-Boilerplate, boxyhq, nextjs/saas-starter) combines AI-first tooling (BMAD + GSD workflows), a modular interactive wizard, and an auto-bugfix CI pipeline. The wizard is the product — without it the template is just another repo to clone. It must be built as a TypeScript `npx` package using `@clack/prompts` (the 2025-2026 standard for CLI wizard UX), not a bash script, to guarantee cross-platform support and testability.

The recommended approach is to build the wizard as a layered, data-driven architecture following the create-t3-app installer map pattern: a static module registry drives all installation logic, wizard prompts collect user intent into an immutable `UserSelections` object, and a separate installation phase executes all side effects after prompts complete. This clean separation makes each layer independently testable and makes adding new modules trivial without touching wizard logic. All must-have code quality modules (ESLint v9 flat config, Husky v9, commitlint, Vitest, TypeScript strict, type-safe env vars) ship pre-configured as table stakes; the AI methodology selection (BMAD, GSD) and agentic system configuration (Claude Code, Cursor, VS Code) are the differentiators that no competitor ships.

The key risks are implementation-level, not strategic: wizard idempotency (re-runs must not overwrite customizations), mutual exclusivity enforcement for ORM and auth choices, and the auto-bugfix workflow's infinite-loop potential via PAT misuse. All three are preventable with deliberate design decisions made before implementation begins — they are expensive to retrofit. A secondary risk is template rot across 44 modules; this requires a maintenance system (Dependabot on the template repo itself + a weekly smoke-test cron) from day one.

---

## Key Findings

### Recommended Stack

The wizard must be a Node.js TypeScript package distributed via `npx`, compiled to CommonJS via `tsup`. This is the same pattern used by `create-t3-app`, `create-next-app`, and `create-remix` — proven at scale. The critical version constraints are: use `@clack/prompts` (not inquirer), `picocolors` (not chalk v5 which is ESM-only), `ora v6` (last CJS-compatible version), and `execa v9` for subprocess spawning. Avoid any `@latest` installs for AI tooling (BMAD, GSD) — pin to specific versions with a maintenance workflow.

**Core technologies:**
- `@clack/prompts ^1.1.0`: Interactive prompts — best-in-class UX (2.5M weekly downloads, used by Astro CLI); provides `multiselect`, `select`, `spinner`, `group`
- `tsup ^8.x`: Zero-config TypeScript → CJS bundler — same tool used by create-t3-app, handles `bin` field correctly
- `execa ^9.x`: Shell command execution — cross-platform, template string syntax, full TypeScript support
- `fs-extra ^11.x`: File system operations — recursive copy, atomic JSON write; fills gaps in `node:fs/promises`
- `commander ^12.x`: CLI argument parsing — handles `--yes`, `--skip-install`, `--name` flags for non-interactive/CI mode
- `which ^4.x`: Binary detection — cross-platform PATH detection for git, npm, code, cursor
- `picocolors ^1.1.x`: Terminal colors — 14x smaller than chalk, CJS+ESM dual, no ESM-only complications

**Critical version warnings:** chalk v5+ and ora v7+ are ESM-only and will cause `ERR_REQUIRE_ESM` in a CJS wizard. Pin chalk to v4 or use picocolors; pin ora to v6.

### Expected Features

See `.planning/research/FEATURES.md` for the full prioritization matrix and competitive analysis.

**Must have (table stakes) — P1:**
- Interactive CLI wizard (`npx create-ai-template`) — the wizard IS the product; without it the template is just a repo
- ESLint v9 flat config (`eslint.config.mjs`) — ESLint 10 removed `.eslintrc` in Feb 2026; mandatory
- Husky v9 + lint-staged + commitlint v19 — expected by all professional templates
- TypeScript strict mode — all five researched competitors ship strict; anything less is a regression
- Vitest v4 + coverage thresholds — `npm test` must work on first clone
- CI/CD pipeline (GitHub Actions: lint → test → SonarCloud → build) — already operational
- Auto-bugfix pipeline (CI failure → GitHub Issue → human-triggered `/fix-issue`) — single most novel feature
- AI methodology selection (BMAD, GSD, or both) — core differentiator; no competitor ships this
- Agentic system configuration (Claude Code `.claude/`, Cursor `.cursor/rules/`, VS Code) — makes AI-native claim concrete
- CodeQL + Dependabot — security baseline, zero marginal cost
- `.template-config.json` persistence — enables idempotency and reproducibility
- Team vs solo wizard mode — CODEOWNERS and branch protection guidance adapt per selection

**Should have (competitive) — P2:**
- Idempotent wizard re-runs (guarded by `.template-config.json` state)
- GSD `/fix-issue` slash command wiring
- DevContainer / Codespaces config
- Docker + docker-compose
- Better Auth / Clerk stub wizard selection

**Defer (v2+):**
- Full SaaS module layer (auth + DB + payments + email + background jobs) — significant scope, fragments user base if rushed
- Stripe, Resend, Upstash Redis activation
- Web UI for the wizard — no practical gain over CLI for target audience
- Monorepo support (Turborepo) — requires dedicated research

### Architecture Approach

The wizard follows a strict three-phase execution model derived from create-t3-app's architecture: (1) prompt phase collects all user intent into an immutable `UserSelections` object — no side effects run during prompts; (2) installation phase fans out to per-module installers driven by a static `MODULE_REGISTRY`; (3) post-install phase executes ordered side-effect scripts (git init, husky install, write `.template-config.json`). This separation makes the wizard predictable, testable, and rollback-safe on Ctrl+C.

**Major components:**
1. **CLI Entry Point** (`index.ts`) — parse argv, detect existing `.template-config.json`, invoke wizard
2. **Wizard Orchestrator** (`wizard.ts`) — `@clack/prompts` sequence → `UserSelections` immutable object
3. **Module Registry** (`registry.ts`) — static map of `ModuleDefinition` objects (deps, devDeps, templateDir, postInstall); pure data, no logic
4. **Installer Coordinator** (`installer/index.ts`) — fans out to File Merger, JSON Merge, Package Installer per selected module
5. **Post-Install Runner** (`post-install.ts`) — ordered side-effect scripts with idempotency guards
6. **Idempotency Layer** (`utils/idempotent.ts`) — existence checks before every install step; reads `.template-config.json` on re-run

**Build order:** types → registry → utils → installer sub-modules → installer coordinator → post-install → wizard → entry point. Build data layer before UI, UI before integration.

### Critical Pitfalls

1. **Module state blindness on re-runs** — wizard re-runs overwrite custom config changes (`.husky/pre-commit`, `eslint.config.mjs`). Prevent by: checking sentinel file existence before every init command; persisting installed modules to `.template-config.json`; reading state on startup to skip already-installed modules.

2. **Mutually exclusive modules installed together** — presenting ORM (Prisma vs Drizzle) and auth (Better Auth vs Clerk) as checkboxes lets users select both, causing schema conflicts confirmed by real GitHub issues. Prevent by: modeling these as `select` (radio) choices, not `multiselect`; adding a conflict-detection validation pass before installation begins.

3. **AI tooling version drift (BMAD/GSD)** — using `@latest` for BMAD/GSD installs causes silent breaks when upstream ships breaking changes in minor versions (BMAD v2.0.27 broke agent discovery; v2.0.26 was the fix). Prevent by: pinning to specific versions in module registry; adding a weekly smoke-test cron that tests the full wizard end-to-end; documenting known-working version combinations.

4. **Auto-bugfix infinite loop via PAT** — if a PAT (not `GITHUB_TOKEN`) is used to push fix commits, GitHub re-triggers the workflow on that push, creating an infinite loop. Prevent by: using `GITHUB_TOKEN` exclusively; adding `if: github.actor != 'github-actions[bot]'` guard; adding a fix-attempt counter with a `max_fix_attempts: 2` ceiling.

5. **Windows/WSL line-ending failures** — Husky hook files checked in with `\r\n` fail silently on Linux CI; native Windows without WSL produces `\r: command not found`. Prevent by: adding `.gitattributes` with `* text=auto eol=lf` and explicit `*.sh text eol=lf`; testing in a CI matrix that includes `windows-latest`.

---

## Implications for Roadmap

The architecture's build order (data layer → UI layer → integration layer) and the pitfall-to-phase mapping together dictate a clear phase sequence. Each phase must be verified as idempotent before the next phase builds on it.

### Phase 1: Foundation — Types, Registry, and Template Files
**Rationale:** The module registry is the foundational data structure everything else depends on. Building it first, before any wizard UI, prevents the anti-pattern of hardcoding module-specific logic in the orchestrator. Version pinning decisions for BMAD/GSD must be made here — they cannot be retrofitted.
**Delivers:** `types.ts`, `registry.ts` with all module definitions, `templates/` directory structure, `dependency-versions.ts` centralized version map, `.gitattributes` with `eol=lf` rules
**Addresses:** Interactive wizard (prerequisite), all module configs (ESLint, Husky, Vitest, TypeScript, AI tooling template dirs)
**Avoids:** Pitfall 3 (version drift — pin here), Pitfall 4 (line endings — `.gitattributes` ships here)
**Research flag:** Standard patterns — no additional research needed; module registry is well-documented via create-t3-app source

### Phase 2: Core Wizard — Prompts, UserSelections, Idempotency
**Rationale:** The wizard orchestrator is the product. It must be built as a clean prompt→UserSelections pipeline with no side effects during prompts. The idempotency layer and `.template-config.json` state management must be built into this phase, not added later. Conflict detection (ORM/auth radio selects) must be in the wizard UI design.
**Delivers:** `wizard.ts` (full prompt sequence), `utils/idempotent.ts`, `.template-config.json` read/write, conflict detection, `--yes`/`--dry-run` flag support, `@clack/prompts` welcome banner
**Addresses:** P1 wizard features: AI methodology selection, agentic system config, team vs solo mode, idempotent re-runs
**Avoids:** Pitfall 1 (module state blindness), Pitfall 2 (mutual exclusivity — radio selects here)
**Uses:** `@clack/prompts`, `commander`, `picocolors`, `which`, `semver`
**Research flag:** Standard patterns — `@clack/prompts` is well-documented with official examples

### Phase 3: Installer Pipeline — File Merger, JSON Merge, Package Installer
**Rationale:** With the registry and wizard complete, the installation pipeline is a mechanical wiring of: copy template files (idempotent), merge `package.json` fragments (deep merge), collect and install npm packages in a single batch. The batch install pattern (collect all packages, then one `npm install`) is critical for performance — per-module installs would be 30x slower.
**Delivers:** `installer/files.ts` (idempotent file copy), `installer/json-merge.ts` (deep merge), `installer/npm.ts` (batch install), `installer/index.ts` (coordinator)
**Addresses:** All P1 module installations: ESLint v9, Husky v9, commitlint, Vitest, TypeScript, env-nextjs, security headers, BMAD, GSD, Claude Code config, Cursor config
**Avoids:** Pitfall 1 (idempotency guards in file copy), Performance trap (batch npm install)
**Uses:** `fs-extra`, `execa`, `tsup` CJS output
**Research flag:** Standard patterns — installer coordinator is well-documented

### Phase 4: Post-Install and Auto-Bugfix Pipeline
**Rationale:** Post-install scripts (git init, husky install, config write) depend on the installer completing successfully. The auto-bugfix pipeline is the single most novel feature — it must be built with loop guards from day one, not patched later. The infinite-loop pitfall (Pitfall 5) is most likely to be introduced during this phase.
**Delivers:** `post-install.ts` with ordered side-effect scripts, `.github/workflows/auto-bugfix.yml` with `GITHUB_TOKEN` and actor guard, fix-attempt counter, issue body sanitization, `/fix-issue` GSD slash command wiring
**Addresses:** Auto-bugfix pipeline (P1), GSD `/fix-issue` command (P2), CODEOWNERS + branch protection (team mode, P1)
**Avoids:** Pitfall 5 (infinite loop — actor guard and `max_fix_attempts` built in), Security mistake (PAT vs GITHUB_TOKEN, prompt injection sanitization)
**Research flag:** NEEDS RESEARCH — auto-bugfix workflow design has novel surface area; GitHub Actions loop prevention and actor filtering deserve a dedicated research pass before implementation

### Phase 5: Packaging, Testing, and Maintenance Infrastructure
**Rationale:** The wizard as an npx package needs to be verified to work across platforms and to not rot. This phase wraps the wizard into a publishable npm package, adds the test suite, and installs the maintenance infrastructure (Dependabot on the template repo, weekly smoke-test cron). Without the smoke-test cron, the 44-module template will rot within 6-12 months.
**Delivers:** `tsup.config.ts` with correct `bin` field, `package.json` `engines: { node: ">=20.0.0" }`, `vitest` unit tests for registry/installers/detection, CI matrix (`ubuntu-latest`, `macos-latest`, `windows-latest` + WSL), Dependabot on template repo, weekly smoke-test cron, `KNOWN_WORKING_VERSIONS.md`
**Addresses:** Cross-platform support (P1), CodeQL + Dependabot (P1), template rot prevention
**Avoids:** Pitfall 4 (Windows CI matrix), Pitfall 6 (template rot — Dependabot + smoke-test cron)
**Research flag:** Standard patterns — npm package publishing and CI matrix are well-documented

### Phase Ordering Rationale

- Registry before wizard: the wizard's multiselect options are driven by registry data; building wizard without registry produces hardcoded options that must be refactored
- Wizard before installer: the `UserSelections` type is the contract between wizard and installer; building installer first means guessing the interface
- Installer before post-install: post-install scripts depend on knowing what was installed; they reference installed module IDs
- Auto-bugfix last in core work: it depends on CI/CD already operational; adding loop guards is easier when the full workflow is visible
- Testing/packaging as a distinct phase: packaging decisions (CJS vs ESM, bin field) affect all prior work if changed late; better to decide early but verify at end

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Auto-bugfix pipeline):** Novel surface area. GitHub Actions loop prevention, actor filtering, issue body sanitization for prompt injection, and `GITHUB_TOKEN` permission scoping need a dedicated research pass. The failure mode (infinite loop) is hard to detect and expensive to recover from.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Module registry pattern is directly observable from create-t3-app source; well-documented
- **Phase 2 (Wizard):** `@clack/prompts` has official documentation and examples; create-t3-app is a reference implementation
- **Phase 3 (Installer pipeline):** File copy, JSON merge, and npm subprocess patterns are well-documented
- **Phase 5 (Packaging/testing):** tsup + vitest + GitHub Actions matrix are standard Node.js CLI publishing patterns

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core technologies confirmed via npm download stats, official docs, and create-t3-app source analysis. CJS vs ESM constraint (chalk v5/ora v7 avoidance) confirmed by Node.js issue tracker. |
| Features | HIGH | Competitive analysis based on direct inspection of create-t3-app, ixartz, boxyhq, nextjs/saas-starter. Differentiator claims (BMAD/GSD/auto-bugfix uniqueness) confirmed by absence in all surveyed competitors. |
| Architecture | MEDIUM | Core patterns (installer map, UserSelections immutability) confirmed from create-t3-app DeepWiki analysis and WebSearch; specific implementation details are inferred patterns, not verified from direct source read. |
| Pitfalls | MEDIUM | Critical pitfalls (idempotency, conflict detection, infinite loop) are well-documented. BMAD version drift confirmed by real GitHub issue. AI tooling pitfalls (prompt injection) are MEDIUM — recent security research, not yet widely exploited. |

**Overall confidence:** HIGH for strategic decisions (what to build, in what order, what to avoid). MEDIUM for implementation details that need validation during coding.

### Gaps to Address

- **Auto-bugfix workflow specifics:** The exact GitHub Actions YAML structure for loop-safe auto-bugfix with `GITHUB_TOKEN`, actor filter, and fix-attempt counter should be researched in Phase 4 before implementation. Reference: `slash-command-dispatch-action` and OpenAI Codex auto-fix CI guide.
- **AI tool detection reliability:** The filesystem-based detection patterns (`.claude/`, `.cursor/rules/`, `.cursorrules` deprecated) are based on official docs as of March 2026. Cursor's `.cursorrules` deprecation timeline is unclear — may still be in active use. Validate during Phase 2 implementation.
- **BMAD v6 install interface:** The wizard wraps `npx bmad-method install`. The exact CLI flags and non-interactive mode for BMAD v6 should be confirmed from BMAD docs during Phase 3 implementation.
- **Windows native support boundary:** Research recommends WSL2 as the support target for bash-based flows, with the npx entry point as the Windows-native fallback. The exact UX for Windows users without WSL (warning message, graceful fallback) needs to be decided during Phase 2 wizard design.

---

## Sources

### Primary (HIGH confidence)
- [@clack/prompts npm](https://www.npmjs.com/package/@clack/prompts) — v1.1.0, 2.5M weekly downloads, March 2026 release confirmed
- [create-t3-app GitHub](https://github.com/t3-oss/create-t3-app) — installer map pattern, dependency version map, package manager detection
- [Cursor Rules docs](https://docs.cursor.com/context/rules) — `.cursor/rules/*.mdc` current standard; `.cursorrules` deprecated
- [Claude Code memory docs](https://code.claude.com/docs/en/memory) — `.claude/` directory structure and CLAUDE.md detection
- [Husky official docs](https://typicode.github.io/husky/get-started.html) — idempotency requirement, `HUSKY=0` for CI
- [GitHub Actions loop prevention](https://github.com/orgs/community/discussions/26970) — GITHUB_TOKEN vs PAT loop behavior
- [Better Auth/Prisma+Drizzle conflict (GitHub Discussion #2239)](https://github.com/better-auth/better-auth/discussions/2239) — confirmed by maintainers

### Secondary (MEDIUM confidence)
- [create-t3-app DeepWiki](https://deepwiki.com/t3-oss/create-t3-app/2.2-cli-usage-and-options) — installer function shape, InstallerOptions type
- [BMAD agent discovery break v2.0.27](https://github.com/bmad-code-org/BMAD-METHOD/issues/817) — version drift risk confirmed
- [Prisma+Drizzle conflict (Vercel community)](https://community.vercel.com/t/conflict-between-prisma-and-drizzle-orm-in-the-project/5917) — real user report
- [Prompt injection in GitHub Actions AI agents (Aikido Security)](https://www.aikido.dev/blog/promptpwnd-github-actions-ai-agents) — recent security research
- [Execa v9 release notes](https://medium.com/@ehmicky/execa-9-release-d0d5daaa097f) — template strings, streaming, TypeScript

### Tertiary (LOW confidence)
- [AI code review false positive rates 60-80% (DevTools Academy)](https://www.devtoolsacademy.com/blog/state-of-ai-code-review-tools-2025/) — rationale for human-triggered (not automated) AI fix; aggregate industry data, needs validation

---
*Research completed: 2026-03-14*
*Ready for roadmap: yes*
