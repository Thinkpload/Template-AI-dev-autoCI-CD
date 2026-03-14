# Architecture

**Analysis Date:** 2026-03-14

## Pattern Overview

**Overall:** Template Repository with Layered AI Workflow Engine

**Key Characteristics:**
- GitHub Template Repository — cloned and customized per-project
- Dual-layer architecture: project scaffold layer + GSD workflow engine layer
- Workflow engine is file-driven (Markdown commands/agents/workflows) backed by a Node.js CLI tool
- Multi-runtime AI agent support (Claude Code, Gemini, OpenCode) via parallel directory trees
- State lives entirely in `.planning/` directory (no database, no in-memory persistence)
- CI/CD pipeline is independent of the workflow engine and runs on GitHub Actions

## Layers

**Project Scaffold Layer:**
- Purpose: Bare-bones SaaS project template — the thing being cloned
- Contains: `.env.example`, `sonar-project.properties`, `setup.sh`, `README.md`, `.github/workflows/ci.yml`, `src/` (placeholder)
- Depends on: Nothing — leaf layer
- Used by: Developers who clone this template to start a new project

**GSD Workflow Engine — Command Definitions:**
- Purpose: Slash commands invoked by a developer in their AI editor to trigger workflows
- Contains: One `.md` file per user-facing command (e.g., `execute-phase.md`, `plan-phase.md`, `map-codebase.md`)
- Location: `.claude/commands/gsd/`, `.gemini/commands/gsd/`, `.opencode/command/`
- Depends on: Workflow definitions (via `@` file references), `gsd-tools.cjs` for state reads
- Used by: Developer running `/gsd:execute-phase`, `/gsd:plan-phase`, etc. inside their AI editor

**GSD Workflow Engine — Workflows:**
- Purpose: Multi-step procedural definitions consumed by commands and agents; these are the actual logic
- Contains: Named workflow `.md` files that describe step-by-step execution using XML `<process>/<step>` blocks
- Location: `.claude/get-shit-done/workflows/`, `.gemini/get-shit-done/workflows/`, `.opencode/get-shit-done/workflows/`
- Depends on: `gsd-tools.cjs` CLI for state mutations, template files for scaffolding, reference documents for behavior rules
- Used by: Commands (via `@` includes) and orchestrator agents (spawned as subagents)

**GSD Workflow Engine — AI Agents:**
- Purpose: Specialized sub-agents spawned by the orchestrator for focused work (planning, execution, verification, mapping)
- Contains: One `.md` per agent role (`gsd-executor.md`, `gsd-planner.md`, `gsd-verifier.md`, `gsd-codebase-mapper.md`, etc.)
- Location: `.claude/agents/`, `.gemini/agents/`, `.opencode/agents/`
- Depends on: `gsd-tools.cjs`, workflow `.md` files, template files, `.planning/` state
- Used by: Orchestrator commands (spawned via `Task()` with `subagent_type`)

**GSD Workflow Engine — CLI Library (`gsd-tools.cjs`):**
- Purpose: Centralized Node.js utility replacing inline bash patterns across all command/workflow/agent files
- Contains: Entry point `gsd-tools.cjs` + domain modules in `lib/`
- Location: `.claude/get-shit-done/bin/gsd-tools.cjs`, `.claude/get-shit-done/bin/lib/`
- Depends on: Node.js built-ins (`fs`, `path`, `child_process`), no external npm packages
- Used by: All workflow and agent `.md` files via `node "./.claude/get-shit-done/bin/gsd-tools.cjs" <command>`

**GSD Workflow Engine — State Layer (`.planning/`):**
- Purpose: Persistent project state — read/written by all workflows across sessions
- Contains: `STATE.md`, `ROADMAP.md`, `config.json`, `REQUIREMENTS.md`, `phases/`, `codebase/`, `todos/`, `debug/`
- Depends on: Nothing (plain files on disk)
- Used by: All layers read/write this directory; it is the single source of truth for project position

**CI/CD Layer:**
- Purpose: Automated quality gates on every push/PR to `main`
- Contains: `.github/workflows/ci.yml`
- Depends on: `npm ci`, `npm run lint`, `npm run test:coverage`, `npm run build`, SonarCloud GitHub Action
- Used by: GitHub Actions runtime; failure produces a GitHub Issue consumed by `BUGFIX-CI-GITHUB-ISSUES` workflow

**Custom Agent Workflows Layer:**
- Purpose: User-defined AI workflows for project-specific automation
- Contains: `_agents/workflows/BUGFIX-CI-GITHUB-ISSUES.md`
- Depends on: `gh` CLI, GitHub Issues API, CI log files
- Used by: Developer manually invoking `/BUGFIX-CI-GITHUB-ISSUES` in their AI editor after a CI failure

## Data Flow

**GSD Command Execution (e.g., `/gsd:execute-phase 3`):**

1. Developer runs `/gsd:execute-phase 3` in AI editor (Claude Code / Gemini / OpenCode)
2. AI editor loads `.claude/commands/gsd/execute-phase.md` (the slim command stub)
3. Command reads the full workflow via `@./.claude/get-shit-done/workflows/execute-phase.md`
4. Workflow bootstraps via `node gsd-tools.cjs init execute-phase 3` → returns JSON with phase info, model, config flags
5. Orchestrator reads `.planning/STATE.md` and `.planning/ROADMAP.md` for project position
6. Orchestrator spawns parallel `gsd-executor` subagents (one per plan in the wave) via `Task(subagent_type="gsd-executor", ...)`
7. Each executor subagent reads its PLAN.md, executes tasks, commits code, writes SUMMARY.md
8. Orchestrator waits for all agents → spot-checks SUMMARY.md and git commits
9. Orchestrator spawns `gsd-verifier` subagent to check phase goal against codebase
10. CLI tool marks phase complete: `node gsd-tools.cjs phase complete 3` → updates ROADMAP.md, STATE.md
11. Auto-advance optionally chains into `transition.md` → next phase planning

**CI Failure Auto-Fix Flow:**

1. Code pushed to `main` → `.github/workflows/ci.yml` triggers
2. CI runs: lint → test:coverage → SonarCloud → build
3. On failure: GH Actions creates a GitHub Issue (label `bug`) with last 50 lines of each failing step's log
4. Developer runs `/BUGFIX-CI-GITHUB-ISSUES` in their AI editor
5. Workflow fetches latest bug issue via `gh issue list --state open --label bug --limit 1`
6. AI reads error logs, identifies failing file/line, edits code, runs validation (`npm run lint` / `npm run test:coverage`)
7. AI commits fix, pushes, closes the GitHub Issue

**State Management:**
- All state is file-based in `.planning/` — no in-memory persistence
- `STATE.md`: current phase/plan position, velocity metrics, blockers (kept under 100 lines)
- `ROADMAP.md`: phase list with completion checkboxes and per-phase plan progress tables
- `config.json`: project-level workflow settings (model profile, branching strategy, feature flags)
- Each command execution is independent and starts by loading state from disk via `gsd-tools.cjs state load`

## Key Abstractions

**Command Stub:**
- Purpose: Thin user-facing entry point that loads the real workflow via `@` file reference
- Examples: `.claude/commands/gsd/execute-phase.md`, `.claude/commands/gsd/plan-phase.md`
- Pattern: Markdown file with a single shell call to `gsd-tools.cjs init` followed by `@workflow-reference`

**Workflow Document:**
- Purpose: Reusable multi-step procedure with `<process>/<step>` XML structure, consumed by commands and agents
- Examples: `.claude/get-shit-done/workflows/execute-phase.md`, `.claude/get-shit-done/workflows/execute-plan.md`, `.claude/get-shit-done/workflows/transition.md`
- Pattern: XML-wrapped Markdown with named steps, bash blocks calling `gsd-tools.cjs`, and `Task()` spawning syntax

**Agent Definition:**
- Purpose: Role-scoped AI subagent with dedicated system prompt, spawned via `Task(subagent_type=...)`
- Examples: `.claude/agents/gsd-executor.md`, `.claude/agents/gsd-planner.md`, `.claude/agents/gsd-verifier.md`, `.claude/agents/gsd-codebase-mapper.md`
- Pattern: Markdown system prompt defining responsibilities, loading workflow context via `@` references, writing artifacts to `.planning/`

**gsd-tools.cjs Domain Module:**
- Purpose: Encapsulate a domain of state operations (state, phase, roadmap, config, milestone, verify)
- Examples: `.claude/get-shit-done/bin/lib/state.cjs`, `.claude/get-shit-done/bin/lib/phase.cjs`, `.claude/get-shit-done/bin/lib/roadmap.cjs`
- Pattern: CommonJS module exporting named command functions; all registered in `gsd-tools.cjs` entry point

**Template Document:**
- Purpose: Reusable file structure with placeholder variables, used by agents to scaffold `.planning/` artifacts
- Examples: `.claude/get-shit-done/templates/state.md`, `.claude/get-shit-done/templates/roadmap.md`, `.claude/get-shit-done/templates/codebase/architecture.md`
- Pattern: Markdown with `[PLACEHOLDER]` substitution vars; includes `<purpose>`, `<guidelines>`, and `<good_examples>` blocks

**Reference Document:**
- Purpose: Behavioral rules and principles loaded by agents as authoritative guidance (e.g., checkpoint types, TDD rules)
- Examples: `.claude/get-shit-done/references/checkpoints.md`, `.claude/get-shit-done/references/tdd.md`, `.claude/get-shit-done/references/verification-patterns.md`
- Pattern: XML-wrapped guidance docs; no code, no templates — pure rules

## Entry Points

**Developer Slash Command:**
- Location: `.claude/commands/gsd/{command}.md` (e.g., `execute-phase.md`, `plan-phase.md`, `map-codebase.md`)
- Triggers: Developer types `/gsd:{command}` in Claude Code, Gemini, or OpenCode IDE
- Responsibilities: Minimal — load workflow context via `@` reference, call init, pass control to workflow

**gsd-tools.cjs CLI:**
- Location: `.claude/get-shit-done/bin/gsd-tools.cjs`
- Triggers: `node gsd-tools.cjs <command> [args]` from within workflow bash blocks
- Responsibilities: Route to domain module, read/write `.planning/` files, output JSON or raw values

**CI Pipeline:**
- Location: `.github/workflows/ci.yml`
- Triggers: Push or PR to `main` branch
- Responsibilities: Install, lint, test with coverage, SonarCloud scan, build; on failure open GitHub Issue

**Setup Script:**
- Location: `setup.sh`
- Triggers: Developer runs `bash setup.sh` after first clone
- Responsibilities: Patch `sonar-project.properties` with org/project key, run `npx bmad-method install`

**Bugfix Workflow:**
- Location: `_agents/workflows/BUGFIX-CI-GITHUB-ISSUES.md`
- Triggers: Developer invokes `/BUGFIX-CI-GITHUB-ISSUES` in AI editor
- Responsibilities: Fetch latest CI failure issue, analyze logs, fix code, validate, commit and push, close issue

## Error Handling

**Strategy:** CLI tool uses `process.exit(1)` with `stderr` error messages; workflows handle exit codes inline with `|| (cat logfile && exit 1)` bash patterns

**Patterns:**
- `gsd-tools.cjs` exports `error(message)` helper that writes to stderr and exits 1
- CI steps redirect output to log files (e.g., `lint.log`, `test.log`, `build.log`) and fail explicitly with `|| (cat *.log && exit 1)`
- Workflow documents contain `<failure_handling>` sections defining fallback behavior for agent failures
- Phase execution: agent failures are categorized (false failure via `classifyHandoffIfNeeded` bug vs real failure), with explicit retry/skip/abort prompts

## Cross-Cutting Concerns

**Logging:**
- `gsd-tools.cjs`: Uses `process.stdout.write` for JSON output, `process.stderr.write` for errors
- CI pipeline: Captures `stdout`/`stderr` to named log files (`lint.log`, `test.log`, `build.log`); last 50 lines included in failure GitHub Issues
- Workflow agents: Plain text output to user via AI editor

**Configuration:**
- `.planning/config.json`: Project-level settings (model profile, branching strategy, parallelization, feature flags)
- `~/.gsd/defaults.json`: User-level global defaults merged into new project configs
- `sonar-project.properties`: SonarCloud static analysis configuration (patched by `setup.sh`)
- `.env` (from `.env.example`): Application-level environment variables

**Multi-Runtime Support:**
- All GSD assets are mirrored across three parallel trees: `.claude/`, `.gemini/`, `.opencode/`
- Same workflows, agents, references, and templates in each
- Only the command format and tooling convention differ per runtime (e.g., `.gemini/commands/gsd/` uses `.toml` stubs)

**Model Resolution:**
- Each agent type maps to a model per quality profile (`quality`, `balanced`, `budget`) via `MODEL_PROFILES` in `.claude/get-shit-done/bin/lib/core.cjs`
- Active profile (`balanced` by default) is stored in `.planning/config.json` as `model_profile`
- Resolved at workflow init time: `node gsd-tools.cjs resolve-model gsd-executor`

---

*Architecture analysis: 2026-03-14*
*Update when major patterns change*
