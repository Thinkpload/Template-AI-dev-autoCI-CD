---
name: autopilot
description: Activate autopilot mode — Claude makes autonomous decisions about quality, validation, and phase transitions
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
  - TodoWrite
  - Skill
  - AskUserQuestion
---

# Autopilot Mode Activated

You are now in **autopilot mode**. Read and follow the rules in `.claude/rules/autopilot.md`.

## Startup Checklist

1. **Load context:** Read `.planning/STATE.md` and `.planning/ROADMAP.md` to understand where the project is.
2. **Determine current phase:** What's the active phase? What's done, what's next?
3. **Show the user a brief status:**
   - Current phase and progress
   - Next deliverable to produce
   - Any blockers from previous session
4. **Begin work** on the next logical task.

## Execution Loop

For each task:

```
1. Identify the task (from sprint plan, roadmap, or user intent)
2. Execute it (use appropriate BMAD skill/workflow)
3. Run quality gate (validation appropriate to the deliverable)
4. If gate passes → commit (if code) → report one-line result → next task
5. If gate fails → self-correct (up to 3 attempts) → if still fails, report and skip
```

## BMAD Integration

Use BMAD skills in this order when working through a full cycle:

**Analysis:**
- `bmad-create-product-brief` → `bmad-domain-research` / `bmad-market-research`

**Planning:**
- `bmad-create-prd` → `bmad-validate-prd` → `bmad-create-ux-design`

**Solutioning:**
- `bmad-create-architecture` → `bmad-create-epics-and-stories` → `bmad-check-implementation-readiness`

**Implementation:**
- `bmad-sprint-planning` → `bmad-create-story` → `bmad-dev-story` → `bmad-code-review` → commit

**After each phase:** run the appropriate GSD command:
- `/gsd:validate-phase` — verify phase quality
- `/gsd:progress` — update state and check next action

## Stop Conditions

Stop autopilot and ask the user when:
- A **destructive action** is needed (force push, delete, publish)
- An **architectural decision** is required that's not covered by existing docs
- **3 consecutive failures** on the same issue after self-correction
- **Context is critical** (gsd-context-monitor reports ≤25%)
- The user says "стоп", "stop", "pause", or "подожди"

## Resume

If autopilot was paused, the user can resume with `/autopilot` again. Re-read STATE.md to pick up where you left off.

---

**Autopilot is active.** Starting now.
