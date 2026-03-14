# Codebase Structure

**Analysis Date:** 2026-03-14

## Directory Layout

```
project-root/
├── .claude/                    # Claude Code GSD runtime
│   ├── agents/                 # AI subagent definitions (gsd-executor, gsd-planner, etc.)
│   ├── commands/
│   │   └── gsd/               # Slash command stubs (one .md per /gsd: command)
│   ├── get-shit-done/
│   │   ├── bin/               # gsd-tools.cjs entry + lib/ modules
│   │   │   └── lib/           # Domain modules: core, state, phase, roadmap, config, etc.
│   │   ├── hooks/             # Hook scripts (context monitor, status line, update check)
│   │   ├── references/        # Behavioral rule documents (checkpoints, TDD, verification)
│   │   ├── templates/         # File templates for .planning/ artifacts
│   │   │   └── codebase/      # Codebase map templates (architecture, stack, etc.)
│   │   └── workflows/         # Multi-step workflow definitions
├── .gemini/                    # Gemini GSD runtime (mirrors .claude/)
│   ├── agents/
│   ├── commands/gsd/          # .toml + .md command stubs
│   ├── get-shit-done/
│   │   ├── bin/lib/
│   │   ├── hooks/
│   │   ├── references/
│   │   ├── templates/codebase/
│   │   └── workflows/
│   └── hooks/
├── .opencode/                  # OpenCode GSD runtime (mirrors .claude/)
│   ├── agents/
│   ├── command/               # Note: singular, unlike .claude/commands/
│   ├── get-shit-done/
│   │   ├── bin/lib/
│   │   ├── hooks/
│   │   ├── references/
│   │   ├── templates/codebase/
│   │   └── workflows/
│   └── hooks/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI pipeline
├── .planning/                  # Project state (created by GSD commands at runtime)
│   └── codebase/              # Codebase map documents (this directory)
├── _agents/
│   └── workflows/
│       └── BUGFIX-CI-GITHUB-ISSUES.md  # Custom AI bugfix workflow
├── research/                   # Research documents and drafts
├── .env.example                # Environment variable template
├── .gitignore
├── README.md
├── setup.sh                    # One-time post-clone setup script
└── sonar-project.properties    # SonarCloud configuration
```

## Directory Purposes

**`.claude/agents/`:**
- Purpose: AI subagent system prompt definitions for Claude Code
- Contains: One `.md` file per agent role
- Key files: `gsd-executor.md`, `gsd-planner.md`, `gsd-verifier.md`, `gsd-codebase-mapper.md`, `gsd-debugger.md`, `gsd-roadmapper.md`, `gsd-phase-researcher.md`, `gsd-project-researcher.md`

**`.claude/commands/gsd/`:**
- Purpose: Slash command stubs that the developer invokes in Claude Code (e.g., `/gsd:execute-phase`)
- Contains: One `.md` file per user-facing GSD command (31 commands)
- Key files: `execute-phase.md`, `plan-phase.md`, `map-codebase.md`, `new-project.md`, `new-milestone.md`, `complete-milestone.md`, `debug.md`, `verify-work.md`, `progress.md`

**`.claude/get-shit-done/bin/`:**
- Purpose: Node.js CLI utility (`gsd-tools.cjs`) and its domain library modules
- Contains: `gsd-tools.cjs` (entry point, ~23KB), `lib/` directory with 10 domain modules
- Key files: `gsd-tools.cjs`, `lib/core.cjs`, `lib/state.cjs`, `lib/phase.cjs`, `lib/roadmap.cjs`, `lib/config.cjs`, `lib/milestone.cjs`, `lib/verify.cjs`, `lib/frontmatter.cjs`, `lib/template.cjs`, `lib/init.cjs`, `lib/commands.cjs`

**`.claude/get-shit-done/hooks/`:**
- Purpose: Hook scripts that run on AI editor lifecycle events
- Contains: JS scripts
- Key files: `gsd-check-update.js`, `gsd-context-monitor.js`, `gsd-statusline.js`

**`.claude/get-shit-done/references/`:**
- Purpose: Authoritative behavioral rule documents loaded by agents as guidance
- Contains: `.md` reference files
- Key files: `checkpoints.md`, `tdd.md`, `verification-patterns.md`, `planning-config.md`, `git-integration.md`, `model-profiles.md`, `questioning.md`

**`.claude/get-shit-done/templates/`:**
- Purpose: File templates for `.planning/` artifacts — loaded by agents when scaffolding new files
- Contains: `.md` template files with placeholder syntax
- Key files: `state.md`, `roadmap.md`, `context.md`, `summary.md`, `milestone.md`, `project.md`, `requirements.md`, `phase-prompt.md`
- Subdirectories: `codebase/` (7 templates for codebase map documents), `research-project/`

**`.claude/get-shit-done/workflows/`:**
- Purpose: Multi-step procedural definitions with `<process>/<step>` structure; the actual execution logic
- Contains: One `.md` per workflow (34 workflows)
- Key files: `execute-phase.md`, `execute-plan.md`, `plan-phase.md`, `new-project.md`, `new-milestone.md`, `complete-milestone.md`, `verify-phase.md`, `verify-work.md`, `map-codebase.md`, `transition.md`, `debug.md` (as `discuss-phase.md`), `health.md`, `progress.md`, `settings.md`, `update.md`

**`.gemini/` and `.opencode/`:**
- Purpose: Mirror of `.claude/` for Gemini and OpenCode AI runtimes respectively
- Contains: Identical workflow/agent/template/reference content; command stubs in runtime-specific format
- Note: `.gemini/commands/gsd/` includes both `.toml` and `.md` stubs per command; `.opencode/command/` is singular not plural

**`.github/workflows/`:**
- Purpose: GitHub Actions CI/CD pipeline definitions
- Contains: `ci.yml`
- Key files: `ci.yml` — full CI pipeline (lint → test:coverage → SonarCloud → build → failure issue)

**`.planning/`:**
- Purpose: Runtime project state directory — created and managed by GSD workflows, not committed in this template
- Contains: `STATE.md`, `ROADMAP.md`, `config.json`, `REQUIREMENTS.md`, `phases/` (phase subdirectories with PLANs, SUMMARYs, VERIFICATION, UAT), `todos/`, `debug/`, `codebase/`
- Special: This directory does not exist in the template — it is created by `/gsd:new-project` at runtime

**`_agents/workflows/`:**
- Purpose: Project-specific custom AI workflows (user-defined, not part of GSD core)
- Contains: `.md` workflow files invoked as slash commands
- Key files: `BUGFIX-CI-GITHUB-ISSUES.md`

**`research/`:**
- Purpose: Research documents and technology evaluation drafts
- Contains: Freeform Markdown documents
- Key files: `RESEARCH-template-technologies.md`, `task draft.md`

## Key File Locations

**Entry Points:**
- `.claude/commands/gsd/execute-phase.md`: Primary developer entry point for phase execution
- `.claude/commands/gsd/plan-phase.md`: Phase planning command
- `.claude/commands/gsd/map-codebase.md`: Codebase analysis command
- `.claude/commands/gsd/new-project.md`: Project initialization command
- `.claude/get-shit-done/bin/gsd-tools.cjs`: CLI entry point invoked by all workflows
- `setup.sh`: One-time post-clone setup

**Configuration:**
- `.planning/config.json`: GSD project settings (created at runtime by `/gsd:new-project`)
- `sonar-project.properties`: SonarCloud project/org keys
- `.env.example`: Application environment variable template
- `.gitignore`: Git exclusions

**Core Logic:**
- `.claude/get-shit-done/bin/gsd-tools.cjs`: CLI dispatcher (~23KB)
- `.claude/get-shit-done/bin/lib/core.cjs`: Shared utilities, path helpers, model profile table (~18KB)
- `.claude/get-shit-done/bin/lib/state.cjs`: STATE.md read/write operations (~28KB)
- `.claude/get-shit-done/bin/lib/phase.cjs`: Phase CRUD and lifecycle (~30KB)
- `.claude/get-shit-done/bin/lib/roadmap.cjs`: ROADMAP.md parsing and updates (~10KB)
- `.claude/get-shit-done/bin/lib/init.cjs`: Compound init commands for workflow bootstrapping (~23KB)
- `.claude/get-shit-done/bin/lib/verify.cjs`: Verification suite and health checks (~31KB)

**Workflow Logic:**
- `.claude/get-shit-done/workflows/execute-phase.md`: Orchestrator for wave-based parallel plan execution (~460 lines)
- `.claude/get-shit-done/workflows/execute-plan.md`: Executor subagent workflow for single-plan execution
- `.claude/get-shit-done/workflows/plan-phase.md`: Phase planning with research and plan generation
- `.claude/get-shit-done/workflows/map-codebase.md`: Parallel codebase mapping with 4 subagents

**CI/CD:**
- `.github/workflows/ci.yml`: Full CI pipeline definition
- `_agents/workflows/BUGFIX-CI-GITHUB-ISSUES.md`: Automated CI failure remediation workflow

**Templates and References:**
- `.claude/get-shit-done/templates/`: All `.planning/` file templates
- `.claude/get-shit-done/references/`: Behavioral rules consumed by agents
- `.claude/get-shit-done/templates/codebase/`: 7 templates for codebase map docs (architecture, stack, structure, conventions, testing, integrations, concerns)

## Naming Conventions

**Files:**
- `kebab-case.md`: Slash command stubs and workflow/reference/template documents
- `PascalCase.md` or `UPPERCASE.md`: Important `.planning/` artifacts (ROADMAP.md, STATE.md, SUMMARY.md, BUGFIX-CI-GITHUB-ISSUES.md)
- `kebab-case.cjs`: Node.js CommonJS modules
- `kebab-case.js`: Node.js ES module hook scripts
- `gsd-{role}.md`: Agent definition files (e.g., `gsd-executor.md`, `gsd-planner.md`)
- `{NN}-{NN}-{slug}.md`: Phase plan files within `.planning/phases/{phase}/` (e.g., `01-01-database-schema.md`)

**Directories:**
- kebab-case: All directories
- Plural for collections: `agents/`, `commands/`, `workflows/`, `templates/`, `references/`, `hooks/`
- `gsd/` subdirectory: GSD-specific commands within a runtime's `commands/` directory
- `lib/`: Library modules within `bin/`

**Special Patterns:**
- `{phase-number}-{plan-number}-{slug}.md`: Plan files (e.g., `03-02-auth-middleware.md`)
- `{phase-number}-VERIFICATION.md`: Verification artifact per phase
- `{phase-number}-UAT.md`: User acceptance testing artifact per phase
- `SUMMARY.md`: Execution completion artifact (one per plan, created in plan directory)

## Where to Add New Code

**New GSD Slash Command:**
- Command stub: `.claude/commands/gsd/{command-name}.md`
- Mirror to: `.gemini/commands/gsd/{command-name}.md` + `.opencode/command/{command-name}.md`
- Full workflow logic: `.claude/get-shit-done/workflows/{command-name}.md` (mirrored to `.gemini/` and `.opencode/`)
- Tests: Not currently present — no test harness for workflow documents

**New GSD Agent:**
- Agent definition: `.claude/agents/gsd-{role}.md`
- Mirror to: `.gemini/agents/gsd-{role}.md` + `.opencode/agents/gsd-{role}.md`
- Register model profile in: `.claude/get-shit-done/bin/lib/core.cjs` (add to `MODEL_PROFILES` object)

**New CLI Command (`gsd-tools.cjs`):**
- Domain logic: `.claude/get-shit-done/bin/lib/{domain}.cjs` (existing or new domain file)
- Register in entry point: `.claude/get-shit-done/bin/gsd-tools.cjs` (add to command router)
- Mirror compiled output to: `.gemini/get-shit-done/bin/lib/` and `.opencode/get-shit-done/bin/lib/`

**New Template:**
- Implementation: `.claude/get-shit-done/templates/{name}.md`
- Mirror to: `.gemini/get-shit-done/templates/` and `.opencode/get-shit-done/templates/`

**New Reference Document:**
- Implementation: `.claude/get-shit-done/references/{name}.md`
- Mirror to: `.gemini/get-shit-done/references/` and `.opencode/get-shit-done/references/`

**New Custom Project Workflow (not GSD core):**
- Implementation: `_agents/workflows/{WORKFLOW-NAME}.md`
- No mirroring required (project-specific)

**New Source Code (SaaS application):**
- Implementation: `src/` (placeholder directory described in README — populate with framework of choice)
- Tests: `src/` (co-located, `*.test.ts` or `*.spec.ts` per `sonar-project.properties`)

## Special Directories

**`.claude/`, `.gemini/`, `.opencode/`:**
- Purpose: AI runtime-specific GSD installations — all three contain the same logical content
- Source: Committed in this template repository as source of truth; copied from GSD npm package by `npx bmad-method install`
- Committed: Yes

**`.planning/`:**
- Purpose: Runtime project state — not present in this template, created by GSD commands
- Source: Auto-generated by `/gsd:new-project`, written to by all GSD workflows
- Committed: Configurable via `commit_docs` in `.planning/config.json` (default: `true`)
- Note: `codebase/` subdirectory is created by `/gsd:map-codebase`

**`_bmad/` and `_bmad-output/`:**
- Purpose: BMAD Method v6 compiled agents and generated artifacts (not present until `setup.sh` runs `npx bmad-method install`)
- Source: Generated by `npx bmad-method install`
- Committed: No (excluded by `sonar-project.properties`)

**`research/`:**
- Purpose: Freeform research and planning drafts
- Source: Manually created
- Committed: Yes

---

*Structure analysis: 2026-03-14*
*Update when directory structure changes*
