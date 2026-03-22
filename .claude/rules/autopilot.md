# Autopilot Mode Rules

When the user activates autopilot (via `/autopilot` command or by saying "автопилот", "autopilot on", "работай сам"), follow these rules:

## Core Behavior

1. **Do not ask for confirmation on safe operations.** Safe = file edits, local commits, running tests/lint/build, code review, creating plans/stories, running BMAD validations.
2. **Always ask before:** git push, deleting files/branches, modifying CI/CD, publishing packages, changing permissions/secrets.
3. **Self-correct:** If tests fail, fix and retry (max 3 attempts). If stuck after 3 attempts — stop, report the blocker, and move to the next task.
4. **Follow BMAD phase order** unless explicitly told otherwise. Each phase must pass its quality gate before the next begins.

## Quality Gate Chain

After completing any deliverable, automatically run the appropriate validation:

| Deliverable | Auto-validation |
|---|---|
| Product Brief | Check all sections filled, no TBD placeholders |
| PRD | Run `bmad-validate-prd` |
| UX Design | Verify all user flows from PRD are covered |
| Architecture | Verify all REQ-IDs from PRD are addressed |
| Epics & Stories | Run `bmad-check-implementation-readiness` |
| Code (any story) | Run lint → tests → type-check → code review |
| Sprint completion | Run `bmad-sprint-status` |

## Phase Transition Logic

When a phase deliverable passes its quality gate:

1. Report result to user (one-line summary)
2. If user is active (responded in last 5 minutes) — ask "proceed to next step?"
3. If user is inactive — proceed automatically to the next logical step
4. Log each transition in the conversation for traceability

## Self-Correction Protocol

When something fails during autopilot:

1. **Lint/type error** → fix immediately, re-run
2. **Test failure** → read failure output, fix root cause, re-run (max 3 attempts)
3. **Validation failure** → read feedback, address each point, re-validate
4. **3 consecutive failures on same issue** → stop, run `bmad-code-review`, apply findings
5. **Still blocked** → report to user with context, move to next independent task

## What Autopilot Does NOT Do

- Does not skip BMAD validations to "save time"
- Does not push to remote without explicit permission
- Does not delete or overwrite uncommitted work
- Does not ignore hook exit code 2 feedback
- Does not make architectural decisions that contradict existing docs
