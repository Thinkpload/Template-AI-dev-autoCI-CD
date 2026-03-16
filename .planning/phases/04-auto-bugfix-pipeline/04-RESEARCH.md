# Phase 4: Auto-Bugfix Pipeline - Research

**Researched:** 2026-03-16
**Domain:** GitHub Actions CI/CD, loop prevention, GitHub CLI, Claude Code slash commands
**Confidence:** HIGH

## Summary

Phase 4 builds three interlocking capabilities on top of the existing `ci.yml` workflow: (1) a security audit step using `npm audit --audit-level=high`, (2) automatic GitHub Issue creation on CI failure using `gh issue create` with `GITHUB_TOKEN`, and (3) a `/fix-issue` Claude Code slash command that reads the Issue, applies a fix, and opens a PR. The loop guard is implemented at two levels: GITHUB_TOKEN's built-in behavior (pushes by the bot do not re-trigger push workflows) plus an explicit `if: github.actor != 'github-actions[bot]'` job-level guard for belt-and-suspenders safety. The fix-attempt counter is tracked via issue comments — the workflow counts bot comments on the issue before acting, and stops at 3.

The existing `ci.yml` already contains a skeleton `Report CI Failure` step that uses `gh issue create` and captures log files. This skeleton is the direct foundation for CI-02; Phase 4 completes and hardens it. The `version-check.yml` already demonstrates `peter-evans/create-pull-request@v7` with GITHUB_TOKEN — that same action is the right tool for opening fix PRs in CI-03/CI-04. No novel infrastructure is needed; Phase 4 wires together patterns already present in the repo.

**Primary recommendation:** Complete the existing `ci.yml` skeleton for CI-01 and CI-02 first (one wave), then build the `/fix-issue` slash command and the `auto-bugfix.yml` reusable workflow (second wave), then wire the attempt counter and `needs-human` label (third wave).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CI-01 | CI pipeline includes `npm audit --audit-level=high` — build fails on high/critical vulnerabilities | npm audit exit-code behavior confirmed: exits non-zero only when vulnerability severity >= specified level; moderate-only returns 0 |
| CI-02 | CI failure triggers automatic GitHub Issue creation with: failing job name, error log excerpt, commit SHA, branch name | Existing `ci.yml` skeleton already uses `gh issue create`; needs job-name, SHA, and branch fields added |
| CI-03 | `/fix-issue <issue-number>` slash command in Claude Code reads the issue, applies a fix, opens a PR without manual copy-paste | Claude Code custom commands in `.claude/commands/` support `$ARGUMENTS`, `Bash`, `gh` CLI tools |
| CI-04 | Workflow uses `GITHUB_TOKEN` (not PAT) + actor filter + `[skip ci]` on fix commits to prevent infinite loop | GITHUB_TOKEN pushes do not trigger push workflows by design; actor guard is belt-and-suspenders |
| CI-05 | After 3 consecutive failed fix attempts, workflow stops creating new PRs and adds `needs-human` label | Count via `gh api /repos/.../issues/{n}/comments \| jq '.comments'` on the issue object |
</phase_requirements>

## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|---------------|---------|---------|--------------|
| `npm audit` | Built into npm v6+ | Security vulnerability scanning | Native npm tool, zero new deps, --audit-level flag controls exit code |
| `gh` CLI | Pre-installed on all GitHub-hosted runners | Create issues, PRs, add labels, read issue data | Official GitHub CLI; no extra action needed |
| `peter-evans/create-pull-request` | v7 (already in version-check.yml) | Open PRs from Actions with GITHUB_TOKEN | Most-used community action for automated PRs; already in this repo |
| `GITHUB_TOKEN` | Built-in secret | Auth for gh CLI and API calls in CI | Scoped to repo, auto-generated, no PAT management |
| Claude Code custom commands | `.claude/commands/` | `/fix-issue` slash command handler | Already the project's convention for GSD commands |

### Supporting
| Library / Tool | Version | Purpose | When to Use |
|---------------|---------|---------|-------------|
| `jq` | Pre-installed on ubuntu-latest | Parse JSON in bash for attempt counting | gh api outputs JSON; jq extracts `.comments` count |
| `gh issue edit --add-label` | gh CLI | Apply `needs-human` label after 3 attempts | Simpler than REST API for label operations |
| `gh issue comment` | gh CLI | Post "Attempt N failed" comments for tracking | Provides audit trail and is the count source |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `peter-evans/create-pull-request` | `gh pr create` in shell | gh pr create is simpler but harder to configure title/labels/branch; peter-evans action handles branch creation cleanly |
| Counting bot comments | Writing a state file / issue label with count | Comments are the simplest append-only log with no race condition; state files require branch commits |
| `if: github.actor != 'github-actions[bot]'` | `[skip ci]` in commit message only | Actor guard is job-level (runs at schedule time); `[skip ci]` is push-message-dependent — both together is belt-and-suspenders |

**Installation:** No new packages required. All tools pre-installed on `ubuntu-latest` runners.

## Architecture Patterns

### Recommended File Structure
```
.github/
├── workflows/
│   ├── ci.yml                    # Extend with: audit step, structured issue creation
│   └── auto-bugfix.yml           # New: triggered by workflow_dispatch from /fix-issue
.claude/
└── commands/
    └── fix-issue.md              # New: /fix-issue <number> slash command
```

### Pattern 1: npm audit in CI (CI-01)

**What:** Add `npm audit --audit-level=high` as a named step in the `build` job before or after lint. Redirect output to `audit.log` for capture in the issue body.

**When to use:** Runs on every push/PR. Does not need `continue-on-error`.

**Example:**
```yaml
# In ci.yml build job steps:
- name: Security Audit
  run: npm audit --audit-level=high > audit.log 2>&1 || (cat audit.log && exit 1)
```

Key behavior (HIGH confidence — verified by running `npm audit --audit-level=high` locally):
- Exits 0 when only moderate/low vulnerabilities exist
- Exits non-zero when any high or critical vulnerability exists
- The `--audit-level` flag changes the exit threshold, not the report content

### Pattern 2: Structured Issue Creation on CI Failure (CI-02)

**What:** The existing `Report CI Failure` step in `ci.yml` already captures logs and calls `gh issue create`. It needs three additions: job name in title, commit SHA, and branch name in the body.

**Example (completing the existing skeleton):**
```yaml
- name: Report CI Failure
  if: failure()
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    ISSUE_TITLE="CI Failed: ${{ github.workflow }} / ${{ github.job }} (#${{ github.run_number }})"
    {
      echo "**Job:** \`${{ github.job }}\`"
      echo "**Branch:** \`${{ github.ref_name }}\`"
      echo "**Commit:** \`${{ github.sha }}\`"
      echo "**Run:** [#${{ github.run_number }}](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})"
      echo ""
      for log in audit.log lint.log test.log build.log; do
        if [ -f "$log" ]; then
          echo "**${log}:**"
          echo '```text'
          tail -n 50 "$log"
          echo '```'
          echo ""
        fi
      done
    } > issue_body.md
    gh issue create \
      --title "$ISSUE_TITLE" \
      --body-file issue_body.md \
      --label "bug,ci-failure" || true
```

The `|| true` prevents the issue-creation step itself from causing a cascade failure if the API call fails (e.g., no permissions).

### Pattern 3: /fix-issue Slash Command (CI-03)

**What:** A Claude Code command file at `.claude/commands/fix-issue.md`. When a developer types `/fix-issue 42`, Claude Code replaces `$ARGUMENTS` with `42`, runs the inline bash to fetch the issue body, then follows the instructions to apply a fix and open a PR.

**File structure (matches existing GSD command format):**
```markdown
---
name: fix-issue
description: Read a GitHub Issue and open a fix PR
argument-hint: "<issue-number>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

Fetch issue #$ARGUMENTS and apply a targeted fix.

Issue content:
!gh issue view $ARGUMENTS --json title,body,labels,number

Steps:
1. Read the issue title and body above
2. Identify the failing code area
3. Apply the minimal fix
4. Run: npm test
5. Commit: git commit -m "fix: resolve issue #$ARGUMENTS [skip ci]"
6. Push branch and open PR referencing the issue
```

Key points:
- The `!command` syntax runs the command at prompt-time and injects output — this is how issue content arrives without copy-paste
- `[skip ci]` in the commit message prevents the push from triggering a new CI run on the fix branch
- The command lives in `.claude/commands/` (project-level), not `~/.claude/commands/` (personal)

### Pattern 4: Loop Prevention (CI-04)

**What:** Two-layer guard ensuring a fix commit never triggers an infinite CI loop.

**Layer 1 — GITHUB_TOKEN behavior (built-in):**
When a workflow pushes with `GITHUB_TOKEN`, GitHub does NOT trigger push-event workflows for that commit. This is documented behavior, not a configuration option. It is the primary guard.

**Layer 2 — Actor filter (belt-and-suspenders):**
Add to the `build` job in `ci.yml`:
```yaml
jobs:
  build:
    if: github.actor != 'github-actions[bot]'
    ...
```

**Layer 3 — [skip ci] on fix commits (belt-and-suspenders-suspenders):**
The `/fix-issue` command includes `[skip ci]` in the commit message. GitHub Actions natively skips push/PR workflows when the commit message contains `[skip ci]`, `[ci skip]`, `[no ci]`, `[skip actions]`, or `[actions skip]`.

**Important caveat (MEDIUM confidence):** When using `peter-evans/create-pull-request@v7` with GITHUB_TOKEN, the created PR branch also will NOT trigger `on: pull_request` CI workflows. If you want CI to run on the fix PR, you must either: (a) accept that CI won't run automatically, or (b) use a PAT / GitHub App token. For this phase, the requirement says GITHUB_TOKEN is mandatory, so CI won't auto-run on fix PRs — this is acceptable and expected.

### Pattern 5: Attempt Counter and needs-human Label (CI-05)

**What:** Before creating a new fix PR, count how many times the bot has already commented "Fix attempt" on this issue. If count >= 3, add `needs-human` label and exit without creating a PR.

**Mechanism:** Use issue comments as an append-only log. Each auto-fix attempt posts a comment. The counter reads `gh api` to get the total comment count, then filters for bot comments with a specific marker.

**Example workflow step (auto-bugfix.yml):**
```yaml
- name: Check fix attempt count
  id: attempts
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    ISSUE_NUMBER: ${{ inputs.issue_number }}
  run: |
    # Count existing bot fix-attempt comments on this issue
    COUNT=$(gh api /repos/${{ github.repository }}/issues/${ISSUE_NUMBER}/comments \
      --jq '[.[] | select(.user.login == "github-actions[bot]") | select(.body | startswith("<!-- fix-attempt --"))] | length')
    echo "attempt_count=${COUNT}" >> "$GITHUB_OUTPUT"

- name: Stop after 3 attempts
  if: steps.attempts.outputs.attempt_count >= 3
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    ISSUE_NUMBER: ${{ inputs.issue_number }}
  run: |
    gh issue edit "${ISSUE_NUMBER}" --add-label "needs-human"
    gh issue comment "${ISSUE_NUMBER}" --body "<!-- fix-attempt -->Auto-fix stopped after 3 failed attempts. Human review required."
    exit 0
```

Note: The `needs-human` label must be pre-created in the repository before the workflow runs. This is a setup step in Wave 0.

### Anti-Patterns to Avoid

- **Using a PAT instead of GITHUB_TOKEN for fix commits:** A PAT-pushed commit WILL trigger CI, creating an infinite loop. GITHUB_TOKEN is the correct tool here.
- **Counting ALL issue comments for attempt tracking:** Other users or bots may comment. Filter by `user.login == "github-actions[bot]"` AND a marker string in the body.
- **Putting the actor guard only on individual steps:** If put on a step, earlier steps (checkout, etc.) still run. Put `if: github.actor != 'github-actions[bot]'` at the job level.
- **Creating issues without `|| true`:** If `gh issue create` fails (permissions issue, API rate limit), the step will fail and mark the run as failed twice.
- **Not pre-creating labels:** `gh issue edit --add-label "needs-human"` fails silently or with an error if the label does not exist in the repo.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Opening PRs from workflows | Custom git push + REST API PR creation | `peter-evans/create-pull-request@v7` | Handles branch naming, conflict detection, PR update vs create logic |
| Counting PR attempts | Custom state files or external storage | Issue comment counting with `gh api` + `jq` | Issue comments are durable, append-only, require no external state |
| Loop prevention logic | Custom commit-message parsing | GITHUB_TOKEN behavior + actor guard + `[skip ci]` | Three independent mechanisms; custom logic is fragile |
| Issue body formatting | Plain text multi-line bash strings | Heredoc to temp file, `--body-file` flag | Avoids shell escaping issues with backticks and special chars |

**Key insight:** Every piece of infrastructure needed for this phase already exists in the repo or on GitHub-hosted runners. The work is wiring, not building.

## Common Pitfalls

### Pitfall 1: Fix PR Does Not Trigger CI
**What goes wrong:** Developer opens fix PR via `/fix-issue`, CI checks never appear on the PR.
**Why it happens:** By design — GITHUB_TOKEN-created branches do not trigger `on: pull_request` workflows. This is the same mechanism that prevents infinite loops.
**How to avoid:** Document this behavior in the workflow. If CI on fix PRs is required in future, use a GitHub App token (out of scope for Phase 4).
**Warning signs:** CI badge missing on auto-created PRs immediately after merge.

### Pitfall 2: Attempt Counter Counts Wrong Comments
**What goes wrong:** The counter reaches 3 prematurely (if other bot comments exist) or never reaches 3 (if marker string is wrong).
**Why it happens:** All bot comments are counted, not just fix-attempt comments.
**How to avoid:** Use an HTML comment marker `<!-- fix-attempt -->` at the start of every bot comment. Filter with `select(.body | startswith("<!-- fix-attempt -->"))`.
**Warning signs:** `needs-human` label appears after < 3 actual fix attempts.

### Pitfall 3: Issue Creation Fires Multiple Times
**What goes wrong:** If the `Report CI Failure` step itself fails (API error), the step is retried and creates duplicate issues.
**Why it happens:** `gh issue create` exit code propagates up; wrapper `|| true` prevents the step exit but not duplicate creation on retry.
**How to avoid:** The `|| true` suffix is mandatory. Accept that rare duplicates may occur (low frequency, acceptable for v1).
**Warning signs:** Multiple identical issues opened for the same run.

### Pitfall 4: `needs-human` Label Does Not Exist
**What goes wrong:** `gh issue edit --add-label "needs-human"` fails with a 422 error because the label was never created.
**Why it happens:** GitHub API requires labels to exist before they can be applied to issues.
**How to avoid:** Wave 0 task must create labels `bug`, `ci-failure`, and `needs-human` via `gh label create` or the repo settings.
**Warning signs:** Workflow step fails at the label step despite correct permissions.

### Pitfall 5: ci.yml Already Has Partial Issue Creation
**What goes wrong:** Phase 4 implementation adds a second, conflicting `Report CI Failure` step instead of completing the existing one.
**Why it happens:** Planner/executor doesn't notice the existing skeleton.
**How to avoid:** Read the existing ci.yml carefully. The step at line 57-88 IS the skeleton. Edit it, don't duplicate it.
**Warning signs:** Two separate issue creation steps in ci.yml.

## Code Examples

### CI-01: npm audit step
```yaml
# Source: npm docs + local verification
- name: Security Audit
  run: npm audit --audit-level=high > audit.log 2>&1 || (cat audit.log && exit 1)
```

### CI-02: Structured issue body with all required fields
```yaml
# Source: existing ci.yml skeleton + GitHub Actions context docs
- name: Report CI Failure
  if: failure()
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    {
      echo "**Job:** \`${{ github.job }}\`"
      echo "**Branch:** \`${{ github.ref_name }}\`"
      echo "**Commit:** \`${{ github.sha }}\`"
      echo "**Run:** [#${{ github.run_number }}](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})"
    } > issue_body.md
    gh issue create \
      --title "CI Failed: ${{ github.job }} on ${{ github.ref_name }} (#${{ github.run_number }})" \
      --body-file issue_body.md \
      --label "bug,ci-failure" || true
```

### CI-04: Actor guard at job level
```yaml
# Source: GitHub community discussions (MEDIUM confidence — pattern verified in multiple community posts)
jobs:
  build:
    if: github.actor != 'github-actions[bot]'
    runs-on: ubuntu-latest
```

### CI-05: Count fix attempts before creating new PR
```yaml
# Source: gh CLI docs + jq filtering pattern
COUNT=$(gh api /repos/${{ github.repository }}/issues/${ISSUE_NUMBER}/comments \
  --jq '[.[] | select(.user.login == "github-actions[bot]") | select(.body | startswith("<!-- fix-attempt -->"))] | length')
```

### CI-03: /fix-issue command structure (frontmatter)
```yaml
# Source: Claude Code docs (alexop.dev verified guide)
---
name: fix-issue
description: Read a GitHub Issue and apply a targeted fix, then open a PR
argument-hint: "<issue-number>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Personal Access Token for bot PRs | GITHUB_TOKEN + actor guard | GitHub ~2020 | Loop prevention is now built-in for GITHUB_TOKEN; PAT is an antipattern for loop-safe automation |
| Manual issue creation scripts | `gh issue create` in CI | GitHub CLI v1.0 (2020) | Single-line issue creation with full context; no curl + jq required |
| Custom CI plugins for PR automation | `peter-evans/create-pull-request@v7` | Action marketplace maturation ~2021 | Handles branch, PR creation/update, labels in one step |
| Markdown files as slash commands | Same — Claude Code `.claude/commands/` | Claude Code launch (2024) | Project-level commands in git; `!bash` pre-execution injects runtime context |

**Deprecated/outdated:**
- Using `curl -H "Authorization: token $PAT"` for issue creation: Replaced by `gh issue create` with `GH_TOKEN`
- `[skip ci]` as the ONLY loop guard: GITHUB_TOKEN behavior makes this redundant but not harmful — both are correct to include

## Open Questions

1. **Does `/fix-issue` need a separate `auto-bugfix.yml` workflow or is it purely a Claude Code command?**
   - What we know: CI-03 says "triggers the GSD slash command handler" — this is a developer-triggered command in Claude Code, not a CI workflow
   - What's unclear: CI-04 mentions "auto-bugfix workflow" — this may refer to the Claude Code command's internal steps OR a separate GitHub Actions workflow
   - Recommendation: Implement CI-03 as a pure Claude Code command (`.claude/commands/fix-issue.md`). CI-04's loop guard applies to any commits/PRs the command creates. No separate GitHub Actions workflow is needed for the developer-triggered path. A separate `auto-bugfix.yml` would only be needed for fully-automated (no-human-trigger) fixing, which is explicitly Out of Scope.

2. **Where does the `needs-human` label get created?**
   - What we know: Labels must pre-exist in the repo for `gh issue edit --add-label` to work
   - What's unclear: Whether the wizard installs this label or it's a one-time manual setup
   - Recommendation: Wave 0 task — add a `gh label create "needs-human" --color "e11d48" --description "Requires human attention"` step, or document it as a repo setup prerequisite.

3. **Should fix-attempt count track across different issues or per-issue?**
   - What we know: CI-05 says "3 consecutive failed fix attempts on the same issue" — clearly per-issue
   - What's unclear: Whether "consecutive" means resetting the count if a fix succeeds
   - Recommendation: Count all bot fix-attempt comments on the issue regardless of success/failure. 3 total attempts = stop. This is simpler and matches the spirit of the requirement.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest v4 (already configured in wizard/) |
| Config file | `wizard/vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CI-01 | `npm audit --audit-level=high` exits non-zero on high/critical | Manual — requires a real vulnerable package | Manual only | N/A |
| CI-02 | Issue created with job name, SHA, branch, error excerpt | Manual — requires a CI run to fail | Manual only | N/A |
| CI-03 | `/fix-issue 42` reads issue and opens PR | Manual — requires GitHub API and Claude Code | Manual only | N/A |
| CI-04 | Fix commit does not re-trigger CI | Manual — requires a push observation | Manual only | N/A |
| CI-05 | After 3 attempts, `needs-human` label added, no new PR | Manual — requires 3 consecutive PR merges | Manual only | N/A |

**Note:** All CI-0x requirements are end-to-end GitHub Actions behaviors that cannot be unit tested with Vitest. They must be verified by actually triggering CI runs. The verification plan for this phase is a manual UAT checklist, not automated unit tests.

### Sampling Rate
- **Per task commit:** `npm test` (wizard unit tests must stay green)
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Manual UAT against a real GitHub repository run

### Wave 0 Gaps
- [ ] Pre-create repository labels: `bug`, `ci-failure`, `needs-human` — prerequisite for CI-02 and CI-05
- [ ] No new Vitest test files needed — CI requirements are integration/manual only

## Sources

### Primary (HIGH confidence)
- Local `npm audit --audit-level=high` execution — exit code 0 with moderate-only, non-zero with high/critical confirmed
- `.github/workflows/ci.yml` — existing skeleton read directly; issue creation step already present at lines 57-88
- `.github/workflows/version-check.yml` — confirms `peter-evans/create-pull-request@v7` already in use
- `.claude/commands/gsd/verify-work.md` — confirms command file format for `.claude/commands/`

### Secondary (MEDIUM confidence)
- [alexop.dev Claude Code slash commands guide](https://alexop.dev/posts/claude-code-slash-commands-guide/) — command structure, `$ARGUMENTS`, `!bash` injection, `allowed-tools` frontmatter
- [GitHub community discussion: Endless cycle of github actions](https://github.com/orgs/community/discussions/74772) — actor guard pattern
- [peter-evans/create-pull-request concepts](https://github.com/peter-evans/create-pull-request/blob/main/docs/concepts-guidelines.md) — GITHUB_TOKEN does not trigger workflows; confirmed by search result summary
- [dev.to: Count comments on a GitHub issue](https://dev.to/optnc/count-comments-on-a-github-issue-1j4d) — `gh api /issues/{n}/comments | jq '.comments'` pattern

### Tertiary (LOW confidence)
- [kieronlawson gist: fix-issue slash command](https://gist.github.com/kieronlawson/e512f4bdd24a010ba76b58682f2b22fa) — community example of `/fix-issue` flow; structure informative but not authoritative

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools pre-installed or already in repo
- Architecture: HIGH — existing ci.yml skeleton + established patterns
- Pitfalls: HIGH — GITHUB_TOKEN loop prevention is documented behavior; label pre-creation is a known gotcha
- Attempt counter: MEDIUM — jq filter pattern inferred from gh api docs; exact field names should be verified during implementation

**Research date:** 2026-03-16
**Valid until:** 2026-09-16 (GitHub Actions API stable; gh CLI field names stable)
