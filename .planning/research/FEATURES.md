# Feature Research

**Domain:** AI-first developer project template / setup wizard (public GitHub template)
**Researched:** 2026-03-14
**Confidence:** HIGH (primary sources: existing 44-module analysis, PROJECT.md, competitive landscape research)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features a developer template must have or users abandon it. No credit for having these, immediate rejection for missing them.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Interactive CLI wizard | Every credible scaffolding tool (create-t3-app, cookiecutter, plop) has one. Users won't manually edit configs. | MEDIUM | Bash or `npx`-based; must work without additional runtime installs |
| Opinionated code quality defaults | ESLint, Prettier, EditorConfig ship pre-configured in all major templates (ixartz, T3, boxyhq). Absent = trust deficit. | LOW | ESLint v9 flat config (`eslint.config.mjs`) is mandatory — ESLint 10 removed `.eslintrc` in Feb 2026 |
| Git hooks (Husky + lint-staged) | Every professional template enforces pre-commit checks. Devs expect commits to be validated locally before CI. | LOW | Husky v9 + lint-staged v15; configs ship pre-installed, hooks activated during wizard |
| Conventional Commits enforcement | Required for semantic versioning and changelog automation. Teams expect this. | LOW | commitlint v19 + `@commitlint/config-conventional`; `.husky/commit-msg` hook |
| TypeScript strict mode | All five researched templates ship strict TypeScript. Anything less is a regression. | LOW | `strict: true` + `noUncheckedIndexedAccess`; path aliases `@/*` |
| Unit test runner pre-configured | Devs expect to `npm test` immediately. Template without tests is a toy. | LOW | Vitest v4 — 5-10x faster than Jest for Next.js, used by ixartz boilerplate |
| Coverage thresholds in CI | Teams expect CI to fail on coverage regression. Standard in all mature templates. | LOW | 80% statements/functions/lines, 70% branches in `vitest.config.ts` |
| CI/CD pipeline (GitHub Actions) | Lint → test → build automation is expected day one. Manually configuring GitHub Actions is friction no one wants. | LOW | Already operational in this template (lint → test → SonarCloud → build) |
| GitHub Issue + PR templates | Every professional open-source and team repo ships these. Absent = looks amateurish. | LOW | `.github/ISSUE_TEMPLATE/` (bug, feature, config) + `PULL_REQUEST_TEMPLATE.md` |
| Security headers | Required by OWASP, expected in any production-targeting template. | LOW | In `next.config.mjs` `headers()` function |
| Dependabot / automated dependency updates | Every template that aims at production ships dependency automation. | LOW | `.github/dependabot.yml` with weekly grouped minor+patch updates |
| `.env.example` with documented vars | Absence of this is a red flag. Every template ships it. | LOW | Should cover all modules with commented-out vars for optional services |
| Type-safe env var validation | `@t3-oss/env-nextjs` is now the standard since T3 popularized it. Devs expect runtime build failure on missing vars. | LOW | `src/env.ts` with Zod schemas, server/client separation |
| README with quick-start | "Clone and forget" templates get abandoned. A 5-minute setup path must be documented. | LOW | Must cover: clone → wizard → first `npm run dev` |
| Cross-platform wizard | macOS, Linux, Windows (WSL) are all in use. Failing on one loses adoption. | MEDIUM | Bash with POSIX-safe syntax; fallback `npx` entry point for Windows |

### Differentiators (Competitive Advantage)

Features that no comparable template currently ships as a cohesive unit. These are where this template wins.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| BMAD v6 AI agent workflows built in | No other public template ships structured SDLC AI agent orchestration. BMAD provides named personas, file-based context passing, and role boundaries across the full development lifecycle. | MEDIUM | Already operational; wizard enables/disables it per project |
| GSD (Get Shit Done) workflow engine | Slash-command-driven task execution within Claude Code. Dramatically reduces context-switching overhead for solo devs. Novel capability with no direct competitor. | MEDIUM | Already operational; `/gsd:` commands documented and wired |
| Auto-bugfix pipeline (CI failure → GitHub Issue → AI fix) | No open-source template offers this loop. When CI fails, a structured GitHub Issue is created automatically with job context, error log, and diff. Developer runs `/fix-issue <n>` in Claude Code to trigger AI-assisted repair. | HIGH | Most differentiating feature; human-triggered (not fully automated) to preserve control |
| AI agentic system configuration (Claude Code, Cursor) | Wizard configures `.claude/`, `.cursor/`, or VS Code extension settings based on chosen agent. Eliminates manual per-project AI tooling setup. | MEDIUM | Other templates are AI-agnostic; this one is AI-native |
| Modular on-demand activation | Create-t3-app is the gold standard for interactive module selection — this template extends the pattern to CI/CD tooling, AI methodology, and code quality layers. Nothing else does all three. | MEDIUM | Wizard persists selections to `.template-config.json` for reproducibility and re-runs |
| Idempotent wizard | Running wizard twice doesn't break anything. Rare in the scaffolding ecosystem (plop/hygen don't enforce this). | MEDIUM | Essential for "add module later" workflows; each module install is guarded by existence checks |
| SonarCloud static analysis wired out of the box | ixartz includes it; create-t3-app, boxyhq, nextjs/saas-starter do not. Combined with CodeQL this is a two-layer security and quality gate. | LOW | Already operational; wizard configures `SONAR_TOKEN` |
| GitHub CodeQL workflow pre-installed | Free on public repos, catches SQLi/XSS/path traversal that ESLint misses. No other template in the surveyed set ships this pre-configured. | LOW | `.github/workflows/codeql.yml` ships with template |
| Team-size adaptive configuration | Wizard asks "solo or team?" and adds CODEOWNERS, branch protection instructions, and stricter PR gate configs for teams. Solo path is leaner. | MEDIUM | Directly addresses the dual audience (solo AI devs + small teams) |
| Reproducible config (`template-config.json`) | Selections from the wizard are persisted. A second dev running the wizard on the same repo gets identical output. Enables team onboarding scripts. | LOW | Simple JSON write; feeds `--yes` flag for non-interactive re-runs |
| DevContainer / Codespaces config | Reduces new-contributor onboarding from "hours figuring out local setup" to "open in Codespaces". ixartz has this; others don't. | LOW | `.devcontainer/devcontainer.json` ships pre-installed |
| `npm audit` in CI with configurable severity gate | Catches vulnerabilities that Dependabot hasn't PRed yet. Standard security hygiene wired at install. | LOW | `--audit-level=high` in `ci.yml` |

### Anti-Features (Deliberately NOT Building in v1)

Features that seem like good ideas but would damage the template's clarity, scope, or adoption.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full SaaS application scaffold (auth, DB, payments) | Users see ixartz/SaaS-Boilerplate and want the whole stack | Opinionated choices (Clerk vs Better Auth, Prisma vs Drizzle) fragment the user base; maintaining version compatibility across 20+ integrated packages is a full-time job. Template would become a product, not a template. | Ship documented stubs in `src/lib/` (auth, stripe, email, redis) activated via wizard. Document the "add full SaaS layer" path clearly. v2 deliverable. |
| Web UI for the wizard | Feels more modern / accessible | Over-engineered for CLI-native users (AI agent devs). Adds a hosting dependency and OAuth complexity for no practical gain vs a terminal wizard. | Excellent CLI UX with color, spinners, and clear prompts achieves the same accessibility at zero infrastructure cost. |
| Fully automated AI PRs on CI failure | "Let the AI just fix it" | High false-positive rate. AI agent may open a PR that masks the root cause, breaks other tests, or introduces regressions. Unreviewed AI commits on main are a liability. | Human-triggered `/fix-issue <n>` preserves developer control while still eliminating the "find the error, read the logs, open Claude, describe the problem" overhead. |
| Monorepo support | Teams want one repo for everything | Doubles the complexity of every wizard path, CI config, and module install. Turborepo/Nx have dedicated tooling for this; a general template can't compete and shouldn't try. | Single-repo template first. Document "how to migrate to Turborepo" as a guide link. |
| Custom AI agent training / fine-tuning | "Tune it for our codebase" | Out of scope, requires infrastructure, and BMAD/GSD operate effectively with standard model weights. | Use BMAD persona files and GSD context files to inject project-specific knowledge without fine-tuning. |
| Windows native (non-WSL) support | Windows devs want native cmd/PowerShell | Bash-to-PowerShell parity is a maintenance nightmare. Most Windows AI devs already use WSL2. | Document WSL2 setup as a one-time prerequisite. `npx` entry point handles the pure Node.js path for Windows users who avoid bash entirely. |
| Visual/interactive TUI (terminal UI framework) | Pretty wizards like Ink or Charm are appealing | Adds a runtime dependency (React/Ink), complicates CI testing of the wizard itself, and can fail on non-interactive terminals (CI environments, Docker). | Bash `select` menus + `read` prompts with clear color output via `tput` or ANSI codes are sufficient and universally compatible. |

---

## Feature Dependencies

```
Interactive CLI Wizard
    └──writes──> .template-config.json
    └──activates──> Must-Have Modules (Husky, ESLint, Prettier, Vitest, TypeScript)
    └──activates──> AI Methodology (BMAD, GSD, or both)
    └──configures──> Agentic System (.claude/, .cursor/, VS Code)
    └──installs──> Optional Modules (auth, DB, Stripe, Sentry...)

Auto-bugfix Pipeline
    └──requires──> CI/CD Pipeline (GitHub Actions)
    └──requires──> GitHub Issues (repo must have issues enabled)
    └──enhances via──> /fix-issue slash command (GSD workflow)

GSD Slash Commands
    └──requires──> Claude Code (or compatible agent)
    └──enhances──> Auto-bugfix Pipeline

BMAD v6 Workflows
    └──independent of──> GSD (both coexist; wizard can disable one)
    └──requires──> AI agent (Claude Code, Cursor, or VS Code extension)

Coverage Thresholds
    └──requires──> Vitest (configured in vitest.config.ts)
    └──requires──> CI/CD Pipeline (enforced in ci.yml)

SonarCloud Analysis
    └──requires──> CI/CD Pipeline
    └──requires──> SONAR_TOKEN secret in GitHub repo

CodeQL Workflow
    └──independent of──> SonarCloud (complementary, not competing)

Idempotent Wizard
    └──requires──> .template-config.json (reads prior state)
    └──enables──> "add module later" workflow

CODEOWNERS + Branch Protection
    └──activated only when──> wizard detects "team" mode
    └──enhances──> PR template (assigns reviewers automatically)

Better Auth ──conflicts──> Clerk (mutually exclusive auth choice)
Prisma ──conflicts──> Drizzle (mutually exclusive ORM choice)
Dependabot ──conflicts──> Renovate (mutually exclusive dep-update choice)
```

### Dependency Notes

- **Auto-bugfix requires CI/CD:** The failure-detection step only runs when GitHub Actions reports a failed job. No CI pipeline = no trigger.
- **GSD enhances Auto-bugfix:** The `/fix-issue` command is a GSD slash command. Without GSD, the developer must manually invoke the AI fix flow.
- **Idempotent wizard requires prior state tracking:** `.template-config.json` is written on first run and read on subsequent runs. Without it, the wizard cannot skip already-installed modules.
- **CODEOWNERS conflicts with solo mode:** Adding CODEOWNERS for a solo dev creates noise (auto-assigned reviews on your own PRs). The wizard must gate this on team selection.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed for the template to be genuinely useful and differentiated on day one.

- [ ] Interactive CLI wizard (`setup.sh`) — without this, the template is just a repo to copy; wizard IS the product
- [ ] AI methodology selection (BMAD, GSD, or both) — core differentiator; must work on first run
- [ ] Agentic system configuration (Claude Code, Cursor, VS Code) — makes the AI-first claim concrete
- [ ] All Must-Have module configs pre-installed (ESLint v9 flat, Prettier, Husky, commitlint, Vitest, TypeScript strict, env-nextjs, security headers) — table stakes without exception
- [ ] Auto-bugfix pipeline (CI failure → GitHub Issue) — single most novel feature; must ship in v1
- [ ] CodeQL + Dependabot configs pre-installed — security baseline, zero marginal cost
- [ ] GitHub Issue/PR templates — professional credibility signal
- [ ] `.template-config.json` persistence — enables idempotency and reproducibility
- [ ] Team vs solo mode — adapts CODEOWNERS and branch protection guidance
- [ ] Cross-platform support (macOS, Linux, WSL) — any failure here blocks adoption

### Add After Validation (v1.x)

Features to add once the core wizard flow is working and the template has early adopters.

- [ ] Playwright E2E config activation — add when users report needing E2E; config already ships, activation is low-effort
- [ ] `npm audit` CI step — trivial add, but schedule it so the v1 CI pipeline isn't cluttered
- [ ] Docker + docker-compose — add when team-mode users report local dev friction
- [ ] Sentry + Pino logging stubs — add when users start building production services from the template
- [ ] Better Auth / Clerk stub selection in wizard — add once auth is the next most requested module

### Future Consideration (v2+)

Features to defer until v1 is validated and actively used.

- [ ] Full SaaS module layer (auth, DB, payments, email, background jobs) — significant scope; v2 is explicitly about this
- [ ] Stripe, Resend, Upstash Redis activation — depends on v2 SaaS layer
- [ ] Storybook activation — only valuable when a component library is being actively developed
- [ ] i18n (next-intl) activation — only valuable at product-market fit stage
- [ ] Web UI for the wizard — revisit only if CLI adoption proves to be the adoption blocker
- [ ] Monorepo support (Turborepo) — requires dedicated research phase before implementation

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Interactive CLI wizard | HIGH | MEDIUM | P1 |
| AI methodology selection (BMAD/GSD) | HIGH | LOW | P1 |
| Agentic system config (.claude, .cursor) | HIGH | LOW | P1 |
| Auto-bugfix pipeline (CI failure → Issue) | HIGH | MEDIUM | P1 |
| Must-Have module pre-installation | HIGH | LOW | P1 |
| ESLint v9 flat config | HIGH | LOW | P1 |
| Husky + lint-staged + commitlint | HIGH | LOW | P1 |
| Vitest + coverage thresholds | HIGH | LOW | P1 |
| TypeScript strict mode | HIGH | LOW | P1 |
| `@t3-oss/env-nextjs` type-safe envs | HIGH | LOW | P1 |
| Security headers (next.config.mjs) | HIGH | LOW | P1 |
| GitHub Issue + PR templates | MEDIUM | LOW | P1 |
| CodeQL workflow | HIGH | LOW | P1 |
| Dependabot config | MEDIUM | LOW | P1 |
| .template-config.json persistence | MEDIUM | LOW | P1 |
| Team vs solo wizard mode | MEDIUM | MEDIUM | P1 |
| DevContainer / Codespaces config | MEDIUM | LOW | P2 |
| CODEOWNERS (team mode) | MEDIUM | LOW | P2 |
| `npm audit` in CI | MEDIUM | LOW | P2 |
| Playwright config (pre-installed) | MEDIUM | LOW | P2 |
| Idempotent wizard (re-run safe) | HIGH | MEDIUM | P2 |
| GSD /fix-issue slash command | HIGH | MEDIUM | P2 |
| Docker + docker-compose | MEDIUM | LOW | P2 |
| Sentry stub | MEDIUM | LOW | P2 |
| Better Auth / Clerk wizard selection | MEDIUM | MEDIUM | P2 |
| Prisma / Drizzle wizard selection | MEDIUM | MEDIUM | P2 |
| Stripe stub | MEDIUM | LOW | P3 |
| Resend + React Email stub | MEDIUM | LOW | P3 |
| Upstash Redis + rate-limit stub | MEDIUM | LOW | P3 |
| Inngest / Trigger.dev stub | LOW | LOW | P3 |
| Feature flags (env-based) | LOW | LOW | P3 |
| Storybook activation | LOW | LOW | P3 |
| i18n (next-intl) | LOW | MEDIUM | P3 |
| Full SaaS scaffold (auth+DB+payments) | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (v1)
- P2: Should have, add when core is stable (v1.x)
- P3: Nice to have, future consideration (v2+)

---

## Competitor Feature Analysis

| Feature | create-t3-app | ixartz/SaaS-Boilerplate | boxyhq/saas-starter-kit | nextjs/saas-starter | **This Template** |
|---------|---------------|--------------------------|--------------------------|---------------------|-------------------|
| Interactive CLI wizard | YES — gold standard | NO — clone and configure | NO — clone and configure | NO — clone and configure | YES — wizard is the core product |
| AI methodology (BMAD/GSD) | NO | NO | NO | NO | YES — built in, wizard-selectable |
| AI agent config (Claude Code, Cursor) | NO | NO | NO | NO | YES — wizard configures agent tooling |
| Auto-bugfix CI pipeline | NO | NO | NO | NO | YES — novel differentiator |
| ESLint v9 flat config | YES | YES | NO (legacy .eslintrc) | YES | YES — ships pre-configured |
| Husky + commitlint | NO | YES | NO | NO | YES |
| Vitest | NO (Jest) | YES | NO | NO | YES |
| TypeScript strict | YES | YES | YES | YES | YES |
| SonarCloud | NO | YES | NO | NO | YES — wired, not just documented |
| CodeQL | NO | NO | NO | NO | YES — pre-installed |
| Dependabot | NO | YES | YES | NO | YES |
| Security headers | Partial | YES | Partial | YES | YES |
| `@t3-oss/env-nextjs` | YES | YES | NO | NO | YES |
| shadcn/ui | NO (not default) | YES | NO | YES | YES — stub/optional |
| Auth (pre-integrated) | YES (NextAuth) | YES (Clerk) | YES (SAML SSO) | YES (custom JWT) | Stub only (v1), full in v2 |
| Database ORM | YES (Prisma/Drizzle) | YES (Drizzle) | YES (Prisma) | YES (Drizzle) | Stub only (v1), full in v2 |
| Payments (Stripe) | NO | YES | YES | YES | Stub only (v1) |
| Docker + devcontainer | NO | YES | YES | NO | YES |
| Modular on-demand install | YES (limited to T3 choices) | NO | NO | NO | YES — extensible to any module |
| Idempotent re-runs | NO | NO | NO | NO | YES |
| Team vs solo mode | NO | NO | YES (enterprise focus) | NO | YES |
| `template-config.json` persistence | NO | NO | NO | NO | YES |
| Infrastructure-agnostic | NO (Vercel-focused) | NO (Vercel-focused) | Partial | NO (Vercel-focused) | YES — no platform lock-in |

**Key competitive conclusion:** No existing template combines AI-first tooling (BMAD + GSD), a modular wizard, and an auto-bugfix pipeline. The closest competitor (create-t3-app) has the best wizard UX but is opinionated about the T3 stack and has no AI agent integration. ixartz has the best pre-configured quality tooling but no wizard and no AI workflow. This template occupies the uncontested intersection: wizard + AI-native + modular + quality-default.

---

## Sources

- [create-t3-app GitHub](https://github.com/t3-oss/create-t3-app) — interactive wizard reference implementation
- [ixartz/SaaS-Boilerplate](https://github.com/ixartz/SaaS-Boilerplate) — most comprehensive quality tooling (Clerk, Drizzle, Vitest, Playwright, Sentry, Husky, commitlint, Codecov)
- [boxyhq/saas-starter-kit](https://github.com/boxyhq/saas-starter-kit) — enterprise-focused (SAML SSO, SCIM, multi-tenancy)
- [nextjs/saas-starter](https://github.com/nextjs/saas-starter) — official Vercel Next.js SaaS template
- [BMAD-METHOD GitHub](https://github.com/bmad-code-org/BMAD-METHOD) — AI agent orchestration framework
- [GitHub Agentic Workflows (Technical Preview)](https://github.blog/changelog/2026-02-13-github-agentic-workflows-are-now-in-technical-preview/) — GitHub-native agentic CI/CD (validates auto-bugfix approach)
- [OpenAI Codex auto-fix CI guide](https://developers.openai.com/cookbook/examples/codex/autofix-github-actions) — reference implementation for AI-powered CI fix
- [slash-command-dispatch-action](https://cicube.io/workflow-hub/slash-command-dispatch-action/) — ChatOps slash command integration
- `research/RESEARCH-template-technologies.md` — 44-module analysis with install commands and priority tiers
- `.planning/PROJECT.md` — project scope, constraints, and key decisions

---
*Feature research for: AI-first developer project template / setup wizard*
*Researched: 2026-03-14*
