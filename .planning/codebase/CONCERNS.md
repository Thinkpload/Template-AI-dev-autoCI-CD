# Codebase Concerns

**Analysis Date:** 2026-03-14

## Tech Debt

**Duplicate `stateExtractField` function declaration:**
- Issue: `stateExtractField` is declared twice in the same file — once at line 12 and again at line 184. The second declaration silently shadows the first.
- Files: `.claude/get-shit-done/bin/lib/state.cjs`
- Impact: In strict mode or future runtimes that reject duplicate declarations, this will throw a `SyntaxError`. Currently Node.js CJS modules allow it (last wins), but the first declaration (which also uses `escapeRegex`) is dead code.
- Fix approach: Remove the duplicate at line 12. The version at line 184 is self-contained and does not depend on the imported `escapeRegex`, making it the correct standalone implementation.

**Hardcoded phase ceiling in `cmdPhaseRemove`:**
- Issue: Phase renumbering iterates from `maxPhase = 99` down, treating 99 as a "reasonable upper bound" for integer phase numbers.
- Files: `.claude/get-shit-done/bin/lib/phase.cjs` (line 626)
- Impact: Projects with more than 99 phases will silently skip renumbering higher-numbered phases. The loop runs downward from 99, so any phase numbered 100+ is never renumbered after a lower phase is removed.
- Fix approach: Dynamically derive the ceiling from the actual highest phase number found in `ROADMAP.md` instead of using the literal `99`.

**State regex parsing: dual-format brittleness:**
- Issue: STATE.md fields are parsed and patched using both `**Field:** value` (bold) and `Field: value` (plain) formats across multiple functions. Every parser and patcher must handle both. The duplication spans `stateExtractField`, `stateReplaceField`, `cmdStatePatch`, `cmdStateUpdate`, `cmdStateAdvancePlan`, `cmdStateSnapshot`, and `cmdPhaseComplete`.
- Files: `.claude/get-shit-done/bin/lib/state.cjs`, `.claude/get-shit-done/bin/lib/phase.cjs`
- Impact: Any new STATE.md field or parser function added by a developer must remember to implement both branches. Omitting one leads to silent failure (field not found, no update performed).
- Fix approach: Standardize STATE.md to a single field format and update all parsers. The YAML frontmatter sync mechanism (`syncStateFrontmatter`) already provides a machine-readable path — parsers could read from frontmatter exclusively for structured fields.

**`cmdPhaseComplete` bypasses `stateReplaceField` helper:**
- Issue: `cmdPhaseComplete` in `phase.cjs` uses hardcoded regex patterns directly (e.g., `/(\*\*Current Phase:\*\*\s*).*/`) instead of calling the `stateReplaceField` helper from `state.cjs`. This creates a third, independent implementation of the same replacement logic.
- Files: `.claude/get-shit-done/bin/lib/phase.cjs` (lines 837-874)
- Impact: If the bold-format regex pattern ever needs to change, it must be updated in at least three separate locations. Any format change will silently leave `cmdPhaseComplete` stale.
- Fix approach: Refactor `cmdPhaseComplete` to call `stateReplaceField` from `state.cjs` for all STATE.md field updates.

**Triplicated GSD installation (`.claude`, `.gemini`, `.opencode`):**
- Issue: The entire GSD toolchain — agents, commands, bin, templates, workflows, and hooks — is duplicated verbatim across `.claude/get-shit-done/`, `.gemini/get-shit-done/`, and `.opencode/get-shit-done/`. This is approximately 12,000+ lines of CJS code replicated three times.
- Files: `.claude/get-shit-done/`, `.gemini/get-shit-done/`, `.opencode/get-shit-done/`
- Impact: Any bug fix, enhancement, or refactor in the core libraries (`core.cjs`, `state.cjs`, `phase.cjs`, etc.) must be applied to all three copies manually. Agent markdown files differ between providers (e.g., tool lists, command paths, orchestrator references), creating legitimate divergence that is difficult to track alongside accidental drift.
- Fix approach: Extract shared CJS library code into a provider-agnostic location (e.g., `.gsd/lib/`) and symlink or reference from each provider's bin directory. Agent `.md` files can remain per-provider since they contain provider-specific syntax.

**`parseMustHavesBlock` uses fragile indent-counting YAML parser:**
- Issue: `parseMustHavesBlock` in `frontmatter.cjs` parses nested `must_haves` YAML sub-blocks by counting exact indentation levels (4-space for block header, 6-space for list items, 8-space for nested key-values, 10-space for array items under keys). Any deviation in indentation by an AI-generated plan file will silently return an empty array.
- Files: `.claude/get-shit-done/bin/lib/frontmatter.cjs` (lines 159-223)
- Impact: `cmdVerifyArtifacts` and `cmdVerifyKeyLinks` depend on this parser. Artifact and key-link checks pass vacuously (return "no items found" rather than an error) when the indent does not match expected levels exactly.
- Fix approach: Replace the indent-count parser with a proper YAML library (e.g., `js-yaml`) for the `must_haves` block, or normalize indentation before parsing.

## Known Bugs

**Commit failure silently returns `nothing_to_commit`:**
- Symptoms: When `execGit(['commit', ...])` fails for any reason other than "nothing to commit" (e.g., a pre-commit hook failure, a signing error, a locked index), `cmdCommit` returns `reason: 'nothing_to_commit'` regardless of the actual error.
- Files: `.claude/get-shit-done/bin/lib/commands.cjs` (lines 246-253)
- Trigger: Any commit failure whose error output does not contain the string "nothing to commit".
- Workaround: The raw `stderr` is included in the JSON output, so callers that inspect the full output object can detect the real error. However, the `--raw` output path only returns `'nothing'`, masking the failure from shell-script callers.

**`stateExtractField` duplicate shadows import of `escapeRegex`:**
- Symptoms: The first `stateExtractField` declaration (line 12) calls `escapeRegex` (imported from `core.cjs`). The second declaration (line 184) reimplements escaping inline. Because the second declaration shadows the first at module scope, the imported `escapeRegex` in `state.cjs` is only actually used by the dead first declaration. This is a latent import-but-never-used situation that will appear as a warning in static analysis.
- Files: `.claude/get-shit-done/bin/lib/state.cjs`

## Security Considerations

**Unpinned GitHub Actions: `SonarSource/sonarcloud-github-action@master`:**
- Risk: The CI workflow uses `@master` (a mutable ref) for the SonarCloud action. Any commit to the upstream `master` branch — including a supply-chain compromise — will immediately affect all CI runs without any review step.
- Files: `.github/workflows/ci.yml` (line 41)
- Current mitigation: None. `actions/checkout@v4` and `actions/setup-node@v4` are correctly pinned to immutable major version tags.
- Recommendations: Pin to a specific commit SHA (`SonarSource/sonarcloud-github-action@<sha>`) or at minimum a versioned tag (e.g., `@v2`). Audit periodically and update deliberately.

**`isGitIgnored` uses string concatenation for shell command:**
- Risk: `isGitIgnored` in `core.cjs` builds the `git check-ignore` command via string concatenation after stripping characters matching `/[^a-zA-Z0-9._\-/]/`. If `targetPath` contains sequences that survive this filter but form unintended shell constructs (e.g., a path like `a-b/../../../etc/passwd`), the shell could interpret them. The character allow-list is conservative but path traversal via allowed characters (`.`, `/`) is not blocked.
- Files: `.claude/get-shit-done/bin/lib/core.cjs` (lines 140-148)
- Current mitigation: The character filter removes most shell metacharacters. The `stdio: 'pipe'` option prevents terminal interaction.
- Recommendations: Pass the target path as a separate argument array element to `execSync` (use `spawn` with an args array rather than string concatenation) to eliminate shell interpretation entirely.

**`process.env.HOME` used on Windows host:**
- Risk: `cmdVerifyReferences` in `verify.cjs` resolves `~/...` paths using `process.env.HOME`. On Windows (the documented development platform per the env block), `HOME` is not set by default; the equivalent is `USERPROFILE` or `HOMEDRIVE`+`HOMEPATH`. The code falls back to an empty string (`|| ''`), silently resolving `~/foo` to `/foo` (an absolute POSIX path) on Windows.
- Files: `.claude/get-shit-done/bin/lib/verify.cjs` (line 229)
- Current mitigation: `os.homedir()` is already used elsewhere in the codebase (e.g., `config.cjs`, `init.cjs`) and correctly resolves the home directory cross-platform.
- Recommendations: Replace `process.env.HOME || ''` with `require('os').homedir()` to match the pattern used in other modules.

**BUGFIX workflow uses `git add .` (broad staging):**
- Risk: The `/BUGFIX-CI-GITHUB-ISSUES` workflow instructs the AI agent to run `git add . && git commit` after applying fixes. This will stage all untracked and modified files — potentially including debug artifacts, `.env` files, or other sensitive content created during the debugging session.
- Files: `_agents/workflows/BUGFIX-CI-GITHUB-ISSUES.md` (line 30)
- Current mitigation: None. There is no git status review step before the add.
- Recommendations: Change `git add .` to `git add -p` or specify explicit paths, and add a `git status` review step before committing.

## Performance Bottlenecks

**`cmdHistoryDigest` scans all phase directories synchronously:**
- Problem: `cmdHistoryDigest` reads every SUMMARY.md file across all archived and current phase directories in a synchronous loop. For projects with many milestones, this can mean reading hundreds of files before returning.
- Files: `.claude/get-shit-done/bin/lib/commands.cjs` (lines 99-198)
- Cause: No caching or incremental digests. Every invocation re-reads all files from disk.
- Improvement path: Cache the digest in `.planning/codebase/history-digest.json` and invalidate only when new SUMMARY.md files are added. The frontmatter sync mechanism already provides timestamped state that could drive cache invalidation.

**`cmdValidateHealth` duplicates `cmdValidateConsistency` logic inline:**
- Problem: `cmdValidateHealth` (820 lines total in `verify.cjs`) re-implements a subset of `cmdValidateConsistency` directly inline rather than calling it. This means the phase directory scan loop runs twice on every health check.
- Files: `.claude/get-shit-done/bin/lib/verify.cjs` (lines 517-808)
- Cause: The health check needed a subset of consistency checks, so they were copied rather than extracted.
- Improvement path: Extract shared validation steps into internal helper functions callable from both `cmdValidateHealth` and `cmdValidateConsistency`.

**`cmdRoadmapAnalyze` re-reads phase directories for every phase:**
- Problem: The roadmap analyze function loops over all phases extracted from ROADMAP.md and for each phase performs a `readdirSync` of the phases directory to find the matching directory. For N phases this is O(N) directory reads.
- Files: `.claude/get-shit-done/bin/lib/roadmap.cjs` (lines 93-217)
- Cause: No pre-read of the directory listing outside the loop.
- Improvement path: Read the phases directory once before the loop and build a lookup map by normalized phase number.

## Fragile Areas

**`frontmatter.cjs` hand-rolled YAML parser:**
- Files: `.claude/get-shit-done/bin/lib/frontmatter.cjs`
- Why fragile: The `extractFrontmatter` function implements a custom YAML parser using a stack-based loop that tracks indentation levels. It handles key-value pairs, inline arrays, block arrays, and two levels of nesting — but does not support multi-line strings, anchors, aliases, quoted keys with spaces, or values containing unescaped colons that are not at key position. AI-generated plan files routinely produce values containing colons (e.g., URLs in `contains:` fields).
- Safe modification: Always test against at least three real PLAN.md files with varied frontmatter. The `cmdFrontmatterValidate` command provides a smoke test.
- Test coverage: No unit tests present for the parser. All testing is integration-level through the CLI router.

**`cmdPhaseRemove` ROADMAP renumbering via global regex replacement:**
- Files: `.claude/get-shit-done/bin/lib/phase.cjs` (lines 602-663)
- Why fragile: After removing an integer phase, all subsequent phase numbers are updated using a descending loop of `String.replace()` calls on the raw ROADMAP.md text. The replacement patterns match "Phase N:" and "Phase N " patterns globally. If a phase name or description contains the substring "Phase 12" (e.g., "Refactor Phase 12 legacy code"), that text will also be renumbered, corrupting the document.
- Safe modification: Always back up ROADMAP.md before running `phase remove`. Verify the result with `validate consistency` immediately after.
- Test coverage: None for the renumbering step specifically.

**`getMilestoneInfo` uses three successive regex fallbacks on raw ROADMAP text:**
- Files: `.claude/get-shit-done/bin/lib/core.cjs` (lines 401-434)
- Why fragile: Milestone version/name detection tries three increasingly loose regex patterns. If none matches, it returns `{ version: 'v1.0', name: 'milestone' }` silently. This default bleeds into branch names, archive directory names, and MILESTONES.md entries. A ROADMAP.md that does not match the expected heading formats will silently generate incorrect v1.0 milestone metadata on every run.
- Safe modification: Ensure ROADMAP.md uses one of the two documented heading formats: `## v1.0 Name` or `- 🚧 **v1.0 Name**`. Validate with `roadmap analyze` after any ROADMAP.md restructuring.
- Test coverage: None.

**STATE.md frontmatter sync on every write:**
- Files: `.claude/get-shit-done/bin/lib/state.cjs` (`writeStateMd`, lines 679-682)
- Why fragile: Every STATE.md write triggers a full `syncStateFrontmatter` round-trip which re-parses the entire markdown body and re-reads the phases directory. If any intermediate write leaves STATE.md in a partially-updated state (e.g., a crash mid-update), the frontmatter may be rebuilt from inconsistent body content.
- Safe modification: Treat STATE.md as append-friendly; avoid patterns that require read-modify-write-read cycles in rapid succession.

## Scaling Limits

**Bash tool 50KB output cap:**
- Current capacity: JSON outputs larger than 50,000 bytes are written to a temp file and a `@file:<path>` pointer is returned instead.
- Limit: The `@file:` protocol requires all Claude Code callers (agents and commands) to detect and handle this redirect. Any caller that does not handle it will receive a truncated path string instead of JSON, silently breaking downstream parsing.
- Files: `.claude/get-shit-done/bin/lib/core.cjs` (lines 42-48)
- Scaling path: The temp file mechanism is a valid workaround; the concern is that callers in agent `.md` files use `$(node gsd-tools.cjs ...)` and must parse the `@file:` response — not all do this consistently.

**Integer-only phase renumbering ceiling at 99:**
- Current capacity: Projects up to 99 integer phases are handled correctly.
- Limit: Phase 100+ is silently excluded from renumbering operations after any phase removal.
- Files: `.claude/get-shit-done/bin/lib/phase.cjs` (line 626)
- Scaling path: Replace `const maxPhase = 99` with a dynamic max derived from parsing the existing phase headings in ROADMAP.md.

## Dependencies at Risk

**No `package.json` — no dependency manifest:**
- Risk: The GSD toolchain (`gsd-tools.cjs` and all `lib/*.cjs` modules) uses only Node.js built-in modules (`fs`, `path`, `os`, `child_process`). There is no `package.json` or lockfile anywhere in the project. This means there is no formal declaration of the Node.js version requirement, no ability to run `npm ci` for the toolchain itself, and no dependency audit surface.
- Impact: If a future enhancement requires a third-party package (e.g., `js-yaml` for proper YAML parsing), there is no manifest to add it to. Developers must know to install packages manually.
- Files: Project root — no `package.json` present
- Migration plan: Add a minimal `package.json` at the project root or in `.gsd/` declaring the Node.js engine requirement (currently `"20"` based on the CI setup).

**`SonarSource/sonarcloud-github-action@master` — floating dependency:**
- Risk: See Security Considerations above. In addition to the security risk, floating to `@master` means breaking changes in the action's API can silently alter CI behavior.
- Impact: CI pipeline may break or produce incorrect analysis without any project-level change triggering the failure.
- Migration plan: Pin to a specific SHA or versioned release tag and set a reminder to update quarterly.

## Missing Critical Features

**No test suite for `gsd-tools.cjs` and supporting libraries:**
- Problem: The entire GSD toolchain (~6,000 lines of CJS across 11 modules) has no automated test coverage. The CI pipeline runs `npm run test:coverage` but this test command targets the application code (if any), not the GSD toolchain itself.
- Blocks: Confident refactoring of the duplicated-across-providers codebase, safe changes to the YAML parser, and validation of the phase renumbering logic.
- Files: No `*.test.*` or `*.spec.*` files present anywhere in `.claude/get-shit-done/`.

**No `.gitignore` present at project root:**
- Problem: No `.gitignore` file was found. The `search_gitignored: false` config default and the `isGitIgnored` function depend on git respecting `.gitignore` rules. Without a `.gitignore`, all generated files (temp JSON output files, `*.bak-*` STATE.md backups, `.planning/quick/` task dirs) will be tracked.
- Files: Project root — no `.gitignore` detected
- Impact: Generated working files accumulate in git history, inflating repository size over time.

## Test Coverage Gaps

**YAML frontmatter parser — no unit tests:**
- What is not tested: Edge cases in `extractFrontmatter`: values containing colons, multi-level nesting, empty arrays vs. empty objects, inline arrays with quoted values.
- Files: `.claude/get-shit-done/bin/lib/frontmatter.cjs`
- Risk: Silent parsing failures produce empty or wrong frontmatter objects, causing downstream commands (`verify plan-structure`, `phase-plan-index`, `history-digest`) to misreport state.
- Priority: High

**Phase renumbering after `phase remove` — no integration test:**
- What is not tested: ROADMAP.md text transformation when removing a phase from the middle of a sequence; specifically, that phase name strings containing phase numbers are not corrupted.
- Files: `.claude/get-shit-done/bin/lib/phase.cjs` (`cmdPhaseRemove`)
- Risk: Silent ROADMAP.md corruption that is only caught on the next human review.
- Priority: High

**`getMilestoneInfo` fallback paths — no unit tests:**
- What is not tested: All three regex fallback branches; behavior when ROADMAP.md is present but uses an unrecognized format.
- Files: `.claude/get-shit-done/bin/lib/core.cjs`
- Risk: Silent return of `{ version: 'v1.0', name: 'milestone' }` on any non-standard ROADMAP format, causing wrong archive directory names and branch names.
- Priority: Medium

**CI failure self-healing workflow (`/BUGFIX-CI-GITHUB-ISSUES`) — no dry-run mode:**
- What is not tested: The automated bugfix workflow has no test harness or dry-run capability. It directly modifies code, commits, and pushes to the repository.
- Files: `_agents/workflows/BUGFIX-CI-GITHUB-ISSUES.md`
- Risk: An AI agent applying an incorrect fix and pushing directly to `main` with no human review gate.
- Priority: High

---

*Concerns audit: 2026-03-14*
